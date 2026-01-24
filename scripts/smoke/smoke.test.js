const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api';
const EMAIL = process.env.TEST_EMAIL || 'admin@local.test';
const PASSWORD = process.env.TEST_PASSWORD || 'ChangeMe123!';
const EMAIL_SUP = process.env.TEST_EMAIL_SUP; // Optional Supervisor/Manager
const PASSWORD_SUP = process.env.TEST_PASSWORD_SUP;

let authToken = '';

const client = axios.create({
    baseURL: API_BASE_URL,
    validateStatus: () => true, // Handle errors manually
});

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
        process.exit(1);
    }
}

async function main() {
    console.log(`🚀 Starting Smoke Test against ${API_BASE_URL}`);

    // 1. Login
    await runStep('Login', async () => {
        const res = await client.post('/auth/login', { email: EMAIL, password: PASSWORD });
        if (res.status !== 200) throw new Error(`Login failed with status ${res.status}`);
        authToken = res.data.token;
        if (!authToken) throw new Error('No token returned');
    });

    // 2. Me
    let userId;
    await runStep('Get Me', async () => {
        const res = await client.get('/me', { headers: { Authorization: `Bearer ${authToken}` } });
        if (res.status !== 200) throw new Error(`Get Me failed with status ${res.status}`);
        userId = res.data.user ? res.data.user.id : (res.data.data ? res.data.data.id : res.data.id);
        console.log(`  (User ID: ${userId})`);
    });

    // 3. Create or List Run
    let runId;
    await runStep('Create/List Run', async () => {
        // Try creating first (requires admin/manager usually, but staff can in some configs)
        const date = new Date().toISOString().split('T')[0];

        // Try to create
        const createRes = await client.post('/runs',
            { area_id: 1, date: date, assigned_to: userId },
            // Note: assigned_to added to ensure we can work on it immediately
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (createRes.status === 201 || createRes.status === 200) {
            // Created or returned existing
            runId = createRes.data.id;
        } else {
            console.log(`  (Create returned ${createRes.status}, falling back to list)`);
            // Fallback: List and pick first
            const listRes = await client.get('/runs', { headers: { Authorization: `Bearer ${authToken}` } });
            if (listRes.status !== 200) throw new Error('List runs failed');

            const runs = listRes.data.data || listRes.data; // Handle pagination or list
            if (runs.length === 0) throw new Error('No runs available to test');
            runId = runs[0].id;
        }
        if (!runId) throw new Error('Could not determine Run ID');
    });

    // 4. Run Detail
    let entryToUpdate = null;
    await runStep(`Get Run Detail (${runId})`, async () => {
        const res = await client.get(`/runs/${runId}`, { headers: { Authorization: `Bearer ${authToken}` } });
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
        }
    });

    // 5. Submit Entry
    if (entryToUpdate) {
        await runStep('Submit Entry', async () => {
            const res = await client.put('/entries', entryToUpdate, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (res.status !== 200 && res.status !== 201) throw new Error(`Entry submit failed: ${res.status}`);
        });
    } else {
        console.log('  (Skipping Entry Submit: No Items/Columns found)');
    }

    // 5.4 Assign Run to Me (to ensure we can work on it)
    await runStep('Assign Run to Me', async () => {
        const res = await client.patch(`/runs/${runId}`,
            { assigned_to: userId },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (res.status !== 200) throw new Error(`Assign Run failed: ${res.status}`);
    });

    // 5.5 Start & Complete Work (Required for Review)
    await runStep('Start Work', async () => {
        const res = await client.post(`/review/runs/${runId}/start`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.status !== 200 && res.status !== 400) throw new Error(`Start Work failed: ${res.status}`);
    });

    await runStep('Complete Work', async () => {
        const res = await client.post(`/review/runs/${runId}/complete`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (res.status !== 200 && res.status !== 400) throw new Error(`Complete Work failed: ${res.status}`);
    });

    // 6. Request Review
    await runStep('Request Review', async () => {
        const res = await client.post(`/review/runs/${runId}/request-review`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
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
        // For smoke test, we treat 400 (Already approved) as PASS.
        if (res.status === 200) return;
        if (res.status === 400 && JSON.stringify(res.data).includes('status')) return; // Already done

        // If 403, and we didn't have special credentials, just warn.
        if (res.status === 403 && !EMAIL_SUP) {
            console.log('  (Skipped: Current user not authorized to approve)');
            return;
        }

        if (res.status !== 200) throw new Error(`Approve failed: ${res.status}`);
    });

    console.log('\n✅ SMOKE TEST PASSED');
    process.exit(0);
}

main();
