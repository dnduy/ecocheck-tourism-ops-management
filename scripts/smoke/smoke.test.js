import axios from 'axios';
import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';
const EMAIL = process.env.TEST_EMAIL || 'admin@local.test';
const PASSWORD = process.env.TEST_PASSWORD || 'ChangeMe123!';
const STAFF_EMAIL = process.env.TEST_EMAIL_STAFF || 'staff@local.test';
const STAFF_PASSWORD = process.env.TEST_PASSWORD_STAFF || 'ChangeMe123!';
const EMAIL_SUP = process.env.TEST_EMAIL_SUP; // Optional Supervisor/Manager
const PASSWORD_SUP = process.env.TEST_PASSWORD_SUP;

let authToken = '';
let staffToken = '';
let entryToUpdate = null;
let templateForRun = null;
const resolveRunId = (payload) => {
    if (!payload) return null;
    if (payload.id) return payload.id;
    if (payload.data?.id) return payload.data.id;
    if (payload.run?.id) return payload.run.id;
    if (payload.data?.run?.id) return payload.data.run.id;
    if (Array.isArray(payload) && payload[0]?.id) return payload[0].id;
    if (Array.isArray(payload.data) && payload.data[0]?.id) return payload.data[0].id;
    if (Array.isArray(payload.data?.data) && payload.data.data[0]?.id) return payload.data.data[0].id;
    return null;
};

const client = axios.create({
    baseURL: API_BASE_URL,
    validateStatus: () => true, // Handle errors manually
});

const unwrap = (payload) =>
    payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;

async function runStep(name, fn) {
    process.stdout.write(`TEST: ${name}... `);
    try {
        await fn();
        console.log('PASS');
    } catch (e) {
        console.log('FAIL');
        console.error(`  Error: ${e.message}`);
        if (e.response) {
            console.error(`  Status: ${e.response.status}`);
            console.error(`  Data:`, JSON.stringify(e.response.data, null, 2));
        }
        throw e;
    }
}

const shouldRun = process.env.RUN_SMOKE_TESTS === 'true';

describe('API smoke test', () => {
    it.skipIf(!shouldRun)('runs critical API flows', async () => {
        console.log(`🚀 Starting Smoke Test against ${API_BASE_URL}`);

        // 1. Login
        await runStep('Login', async () => {
            const res = await client.post('/auth/login', { email: EMAIL, password: PASSWORD });
            if (res.status !== 200) throw new Error(`Login failed with status ${res.status}`);
            authToken = res.data.token;
            if (!authToken) throw new Error('No token returned');
        });

        // 1.5 Ensure Staff User
        let staffUser = null;
        await runStep('Ensure Staff User', async () => {
            const res = await client.get('/users', { headers: { Authorization: `Bearer ${authToken}` } });
            if (res.status !== 200) throw new Error(`List users failed: ${res.status}`);
            const users = unwrap(res.data) || [];
            staffUser = users.find((u) => u.email === STAFF_EMAIL) || null;

            if (!staffUser) {
                const createRes = await client.post(
                    '/users',
                    { name: 'Smoke Staff', email: STAFF_EMAIL, password: STAFF_PASSWORD, role: 'staff' },
                    { headers: { Authorization: `Bearer ${authToken}` } }
                );
                if (createRes.status !== 201) throw new Error(`Create staff failed: ${createRes.status}`);
                staffUser = unwrap(createRes.data);
            } else {
                const updateRes = await client.patch(
                    `/users/${staffUser.id}`,
                    { password: STAFF_PASSWORD, role: 'staff' },
                    { headers: { Authorization: `Bearer ${authToken}` } }
                );
                if (updateRes.status !== 200) throw new Error(`Update staff failed: ${updateRes.status}`);
                staffUser = unwrap(updateRes.data) || staffUser;
            }
        });

        await runStep('Login Staff', async () => {
            const res = await client.post('/auth/login', { email: STAFF_EMAIL, password: STAFF_PASSWORD });
            if (res.status !== 200) throw new Error(`Staff login failed with status ${res.status}`);
            staffToken = res.data.token;
            if (!staffToken) throw new Error('No staff token returned');
        });
        if (!staffUser || !staffUser.id) {
            throw new Error('Staff user not available');
        }

    // 2. Me
    let userId;
    await runStep('Get Me', async () => {
        const res = await client.get('/me', { headers: { Authorization: `Bearer ${authToken}` } });
        if (res.status !== 200) throw new Error(`Get Me failed with status ${res.status}`);
        userId = res.data.user ? res.data.user.id : (res.data.data ? res.data.data.id : res.data.id);
        console.log(`  (User ID: ${userId})`);
    });

    // 2.5. Load templates for entry flow (prefer one with items + columns)
    await runStep('Load Templates', async () => {
        const res = await client.get('/templates', { headers: { Authorization: `Bearer ${authToken}` } });
        if (res.status !== 200) throw new Error(`Templates failed with status ${res.status}`);

        const templates = res.data?.data || res.data || [];
        templateForRun = templates.find((t) => {
            const groups = t.groups || [];
            const columns = t.columns || [];
            const hasItem = groups.some((g) => (g.items || []).length > 0);
            return hasItem && columns.length > 0;
        }) || null;

        if (templateForRun) {
            const firstGroup = (templateForRun.groups || []).find((g) => (g.items || []).length > 0);
            const item = firstGroup?.items?.[0];
            const column = templateForRun.columns?.[0];
            if (item && column) {
                entryToUpdate = {
                    item_id: item.id,
                    column_id: column.id,
                    value: 'ok',
                    note: 'Smoke Test',
                };
            }
        }
    });

    // 3. Create or List Run
    let runId;
    await runStep('Create/List Run', async () => {
        // Try creating first (requires admin/manager usually, but staff can in some configs)
        const date = new Date().toISOString().split('T')[0];

        const createPayload = templateForRun
            ? { area_id: templateForRun.area?.id || 1, checklist_template_id: templateForRun.id, date: date, assigned_to: staffUser.id }
            : { area_id: 1, date: date, assigned_to: staffUser.id };

        // Try to create
        const createRes = await client.post('/runs',
            createPayload,
            // Note: assigned_to added to ensure we can work on it immediately
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (createRes.status === 201 || createRes.status === 200) {
            // Created or returned existing
            runId = resolveRunId(createRes.data);
        } else {
            console.log(`  (Create returned ${createRes.status}, falling back to list)`);
            // Fallback: List and pick first
            const listRes = await client.get('/runs', { headers: { Authorization: `Bearer ${authToken}` } });
            if (listRes.status !== 200) throw new Error('List runs failed');

            runId = resolveRunId(listRes.data);
        }
        if (!runId) throw new Error('Could not determine Run ID');
    });

    // 4. Assign Run to Staff (to ensure we can work on it)
    await runStep('Assign Run to Staff', async () => {
        const res = await client.patch(`/runs/${runId}`,
            { assigned_to: staffUser.id },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (res.status !== 200) throw new Error(`Assign Run failed: ${res.status}`);
    });

    // 5. Run Detail (as Staff)
    await runStep(`Get Run Detail (${runId})`, async () => {
        const res = await client.get(`/runs/${runId}`, { headers: { Authorization: `Bearer ${staffToken}` } });
        if (res.status !== 200) throw new Error(`Get Run failed with status ${res.status}`);

        // Find a valid item/column to update
        if (res.data.items && res.data.items.length > 0 && res.data.columns && res.data.columns.length > 0) {
            entryToUpdate = {
                run_id: runId,
                item_id: res.data.items[0].id,
                column_id: res.data.columns[0].id,
                value: 'ok',
                note: 'Smoke Test'
            };
        } else if (entryToUpdate) {
            entryToUpdate = { ...entryToUpdate, run_id: runId };
        }
    });

    // 6. Submit Entry
    if (entryToUpdate) {
        await runStep('Submit Entry', async () => {
            const res = await client.put('/entries', entryToUpdate, {
                headers: { Authorization: `Bearer ${staffToken}` }
            });
            if (res.status !== 200 && res.status !== 201) throw new Error(`Entry submit failed: ${res.status}`);
        });
    } else {
        console.log('  (Skipping Entry Submit: No Items/Columns found)');
    }

    // 7. Start & Complete Work (Required for Review)
    await runStep('Start Work', async () => {
        const res = await client.post(`/review/runs/${runId}/start`, {}, {
            headers: { Authorization: `Bearer ${staffToken}` }
        });
        if (res.status !== 200 && res.status !== 400) throw new Error(`Start Work failed: ${res.status}`);
    });

    await runStep('Complete Work', async () => {
        const res = await client.post(`/review/runs/${runId}/complete`, {}, {
            headers: { Authorization: `Bearer ${staffToken}` }
        });
        if (res.status !== 200 && res.status !== 400) throw new Error(`Complete Work failed: ${res.status}`);
    });

    // 6. Request Review
    await runStep('Request Review', async () => {
        const res = await client.post(`/review/runs/${runId}/request-review`, {}, {
            headers: { Authorization: `Bearer ${staffToken}` }
        });
        // 200 OK or 400 if already requested/approved (which is acceptable for smoke test on existing data)
        if (res.status !== 200 && res.status !== 400) throw new Error(`Request Review failed: ${res.status}`);
    });

    // 7. Approve (Optional, needs Manager/Supervisor)
    // If EMAIL_SUP is provided, login as them. Otherwise try as current user (if admin)
    await runStep('Approve Run (Manager/Sup)', async () => {
        let approverToken = authToken;

        if (EMAIL_SUP && PASSWORD_SUP) {
            const loginRes = await client.post('/auth/login', { email: EMAIL_SUP, password: PASSWORD_SUP });
            if (loginRes.status === 200) {
                approverToken = loginRes.data.token;
            }
        }

        const res = await client.post(`/review/runs/${runId}/approve`, {}, {
            headers: { Authorization: `Bearer ${approverToken}` }
        });

        // 200 OK or 400/403 (if already approved or not allowed).
        // For smoke test, we treat 400 as PASS to keep idempotent behavior.
        if (res.status === 200) return;
        if (res.status === 400) return;

        // If 403, and we didn't have special credentials, just warn.
        if (res.status === 403 && !EMAIL_SUP) {
            console.log('  (Skipped: Current user not authorized to approve)');
            return;
        }

        if (res.status !== 200) throw new Error(`Approve failed: ${res.status}`);
    });

        console.log('\n✅ SMOKE TEST PASSED');
        expect(true).toBe(true);
    });
});
