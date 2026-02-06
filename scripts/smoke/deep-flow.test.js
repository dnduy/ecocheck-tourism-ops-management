import axios from 'axios';
import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:8000/api';
const ADMIN_EMAIL = process.env.TEST_EMAIL || 'admin@local.test';
const ADMIN_PASSWORD = process.env.TEST_PASSWORD || 'ChangeMe123!';
const STAFF_EMAIL = process.env.TEST_EMAIL_STAFF || 'staff@local.test';
const STAFF_PASSWORD = process.env.TEST_PASSWORD_STAFF || 'ChangeMe123!';
const SUP_EMAIL = process.env.TEST_EMAIL_SUP || 'supervisor@local.test';
const SUP_PASSWORD = process.env.TEST_PASSWORD_SUP || 'ChangeMe123!';

const shouldRun = process.env.RUN_DEEP_TESTS === 'true';

const client = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: () => true,
});

const unwrap = (payload) =>
  payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;

async function runStep(name, fn) {
  process.stdout.write(`TEST: ${name}... `);
  try {
    const result = await fn();
    console.log('PASS');
    return result;
  } catch (e) {
    console.log('FAIL');
    console.error(`  Error: ${e.message}`);
    if (e.response) {
      console.error(`  Status: ${e.response.status}`);
      console.error('  Data:', JSON.stringify(e.response.data, null, 2));
    }
    throw e;
  }
}

async function login(email, password) {
  const res = await client.post('/auth/login', { email, password });
  if (res.status !== 200) throw new Error(`Login failed: ${res.status}`);
  return res.data.token;
}

async function ensureUser(token, { name, email, password, role }) {
  const res = await client.get('/users', { headers: { Authorization: `Bearer ${token}` } });
  if (res.status !== 200) throw new Error(`List users failed: ${res.status}`);
  const users = unwrap(res.data) || [];
  let user = users.find((u) => u.email === email);
  if (!user) {
    const createRes = await client.post(
      '/users',
      { name, email, password, role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (createRes.status !== 201) throw new Error(`Create user failed: ${createRes.status}`);
    user = unwrap(createRes.data);
  } else {
    const updateRes = await client.patch(
      `/users/${user.id}`,
      { password, role },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (updateRes.status !== 200) throw new Error(`Update user failed: ${updateRes.status}`);
    user = unwrap(updateRes.data) || user;
  }
  return user;
}

async function createArea(token, name) {
  const res = await client.post(
    '/areas',
    { name },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`Create area failed: ${res.status}`);
  }
  return unwrap(res.data);
}

function buildColumnLabels(columnsCount) {
  const baseTimes = ['08:00', '12:00', '16:00', '20:00', '22:00'];
  return Array.from({ length: columnsCount }, (_, idx) => {
    const time = baseTimes[idx % baseTimes.length];
    const role = idx === columnsCount - 1 ? 'Giam sat' : 'Kiem tra';
    return `${time} - ${role}`;
  });
}

async function createTemplate(token, areaId, options = {}) {
  const itemsCount = Math.max(1, options.itemsCount ?? 2);
  const columnsCount = Math.max(1, options.columnsCount ?? 2);
  const items = Array.from({ length: itemsCount }, (_, idx) => ({ title: `Item ${idx + 1}` }));
  const payload = {
    area_id: areaId,
    name: `Template Deep ${Date.now()}`,
    is_active: true,
    groups: [
      {
        title: 'Kiem tra',
        items,
      },
    ],
  };

  const res = await client.post('/templates', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`Create template failed: ${res.status}`);
  }
  const created = unwrap(res.data);

  const updateRes = await client.put(
    `/templates/${created.id}`,
    {
      columns: buildColumnLabels(columnsCount).map((label) => ({ label })),
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (updateRes.status !== 200) {
    throw new Error(`Update template columns failed: ${updateRes.status}`);
  }
  return unwrap(updateRes.data);
}

async function createRun(token, areaId, templateId) {
  const date = new Date().toISOString().split('T')[0];
  const res = await client.post(
    '/runs',
    { area_id: areaId, checklist_template_id: templateId, date },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`Create run failed: ${res.status}`);
  }
  const payload = unwrap(res.data) || {};
  return payload.id || payload.run?.id || payload.data?.id;
}

async function prepareRunWithEntries({ adminToken, staffUser }) {
  const area = await runStep('Create Area', async () => {
    return createArea(adminToken, `Khu Test Role ${Date.now()}`);
  });

  const template = await runStep('Create Template (multi-columns)', async () => {
    return createTemplate(adminToken, area.id);
  });

  const runId = await runStep('Create Run', async () => {
    const id = await createRun(adminToken, area.id, template.id);
    if (!id) throw new Error('No run id returned');
    return id;
  });

  await runStep('Assign Run to Staff', async () => {
    const res = await client.patch(
      `/runs/${runId}`,
      { assigned_to: staffUser.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (res.status !== 200) throw new Error(`Assign run failed: ${res.status}`);
  });

  const staffToken = await runStep('Login Staff', async () => {
    return login(STAFF_EMAIL, STAFF_PASSWORD);
  });

  const runDetail = await runStep('Get Run Detail', async () => {
    const res = await client.get(`/runs/${runId}`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    if (res.status !== 200) throw new Error(`Run detail failed: ${res.status}`);
    return unwrap(res.data);
  });

  const items = runDetail.items || [];
  const columns = runDetail.template?.columns || [];
  if (items.length === 0 || columns.length < 2) {
    throw new Error('Missing items or columns for entry flow');
  }

  await runStep('Submit Entries (2 columns)', async () => {
    const item = items[0];
    const targets = columns.slice(0, 2);
    for (const column of targets) {
      const res = await client.put(
        '/entries',
        {
          run_id: runId,
          item_id: item.id,
          column_id: column.id,
          value: 'ok',
          note: 'Deep Flow',
        },
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
      if (res.status !== 200 && res.status !== 201) {
        throw new Error(`Entry submit failed: ${res.status}`);
      }
    }
  });

  await runStep('Start Work (staff)', async () => {
    const res = await client.post(
      `/review/runs/${runId}/start`,
      {},
      { headers: { Authorization: `Bearer ${staffToken}` } }
    );
    if (res.status !== 200) throw new Error(`Start work failed: ${res.status}`);
  });

  await runStep('Complete Work (staff)', async () => {
    const res = await client.post(
      `/review/runs/${runId}/complete`,
      {},
      { headers: { Authorization: `Bearer ${staffToken}` } }
    );
    if (res.status !== 200) throw new Error(`Complete work failed: ${res.status}`);
  });

  await runStep('Request Review (staff)', async () => {
    const res = await client.post(
      `/review/runs/${runId}/request-review`,
      {},
      { headers: { Authorization: `Bearer ${staffToken}` } }
    );
    if (res.status !== 200) throw new Error(`Request review failed: ${res.status}`);
  });

  return { runId, staffToken };
}

async function prepareRunAssigned({ adminToken, staffUser }) {
  const area = await runStep('Create Area', async () => {
    return createArea(adminToken, `Khu Test Role ${Date.now()}`);
  });

  const template = await runStep('Create Template (multi-columns)', async () => {
    return createTemplate(adminToken, area.id);
  });

  const runId = await runStep('Create Run', async () => {
    const id = await createRun(adminToken, area.id, template.id);
    if (!id) throw new Error('No run id returned');
    return id;
  });

  await runStep('Assign Run to Staff', async () => {
    const res = await client.patch(
      `/runs/${runId}`,
      { assigned_to: staffUser.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (res.status !== 200) throw new Error(`Assign run failed: ${res.status}`);
  });

  return { runId };
}

describe('Deep role + entry flow', () => {
  it.skipIf(!shouldRun)('runs staff + supervisor review with multi-column entries', async () => {
    console.log(`🚀 Starting Deep Flow Test against ${API_BASE_URL}`);

    const adminToken = await runStep('Login Admin', async () => {
      return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    const staffUser = await runStep('Ensure Staff User', async () => {
      return ensureUser(adminToken, {
        name: 'Staff User',
        email: STAFF_EMAIL,
        password: STAFF_PASSWORD,
        role: 'staff',
      });
    });

    const supervisorUser = await runStep('Ensure Supervisor User', async () => {
      return ensureUser(adminToken, {
        name: 'Supervisor User',
        email: SUP_EMAIL,
        password: SUP_PASSWORD,
        role: 'supervisor',
      });
    });

    const { runId, staffToken } = await prepareRunWithEntries({ adminToken, staffUser });

    await runStep('Assign Verifier (supervisor)', async () => {
      const res = await client.patch(
        `/runs/${runId}`,
        { verified_by: supervisorUser.id },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.status !== 200) throw new Error(`Set verifier failed: ${res.status}`);
    });

    const supervisorToken = await runStep('Login Supervisor', async () => {
      return login(SUP_EMAIL, SUP_PASSWORD);
    });

    await runStep('Approve Run (supervisor)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${supervisorToken}` } }
      );
      if (res.status !== 200) throw new Error(`Approve failed: ${res.status}`);
    });

    await runStep('Verify Run Status + Entries', async () => {
      const res = await client.get(`/runs/${runId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Run recheck failed: ${res.status}`);
      const payload = unwrap(res.data);
      if (payload.work_status !== 'approved') {
        throw new Error(`Expected work_status approved, got ${payload.work_status}`);
      }
      const entries = payload.entries || [];
      if (entries.length < 2) {
        throw new Error(`Expected >=2 entries, got ${entries.length}`);
      }
    });

    console.log('\n✅ DEEP FLOW TEST PASSED');
    expect(true).toBe(true);
  });

  it.skipIf(!shouldRun)('runs reject -> resubmit -> approve flow', async () => {
    console.log(`🚀 Starting Reject/Resubmit Flow against ${API_BASE_URL}`);

    const adminToken = await runStep('Login Admin', async () => {
      return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    const staffUser = await runStep('Ensure Staff User', async () => {
      return ensureUser(adminToken, {
        name: 'Staff User',
        email: STAFF_EMAIL,
        password: STAFF_PASSWORD,
        role: 'staff',
      });
    });

    const supervisorUser = await runStep('Ensure Supervisor User', async () => {
      return ensureUser(adminToken, {
        name: 'Supervisor User',
        email: SUP_EMAIL,
        password: SUP_PASSWORD,
        role: 'supervisor',
      });
    });

    const { runId, staffToken } = await prepareRunWithEntries({ adminToken, staffUser });

    await runStep('Assign Verifier (supervisor)', async () => {
      const res = await client.patch(
        `/runs/${runId}`,
        { verified_by: supervisorUser.id },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.status !== 200) throw new Error(`Set verifier failed: ${res.status}`);
    });

    const supervisorToken = await runStep('Login Supervisor', async () => {
      return login(SUP_EMAIL, SUP_PASSWORD);
    });

    await runStep('Reject Run (supervisor)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/reject`,
        { review_note: 'Can bo sung thong tin' },
        { headers: { Authorization: `Bearer ${supervisorToken}` } }
      );
      if (res.status !== 200) throw new Error(`Reject failed: ${res.status}`);
    });

    await runStep('Resubmit (staff)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/resubmit`,
        {},
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
      if (res.status !== 200) throw new Error(`Resubmit failed: ${res.status}`);
    });

    await runStep('Approve Run (supervisor)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${supervisorToken}` } }
      );
      if (res.status !== 200) throw new Error(`Approve failed: ${res.status}`);
    });

    await runStep('Verify Run Status', async () => {
      const res = await client.get(`/runs/${runId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Run recheck failed: ${res.status}`);
      const payload = unwrap(res.data);
      if (payload.work_status !== 'approved') {
        throw new Error(`Expected work_status approved, got ${payload.work_status}`);
      }
    });

    console.log('\n✅ REJECT/RESUBMIT FLOW PASSED');
    expect(true).toBe(true);
  });

  it.skipIf(!shouldRun)('enforces approval authorization rules', async () => {
    console.log(`🚀 Starting Approval Authorization Flow against ${API_BASE_URL}`);

    const adminToken = await runStep('Login Admin', async () => {
      return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    const staffUser = await runStep('Ensure Staff User', async () => {
      return ensureUser(adminToken, {
        name: 'Staff User',
        email: STAFF_EMAIL,
        password: STAFF_PASSWORD,
        role: 'staff',
      });
    });

    const supervisorUser = await runStep('Ensure Supervisor User', async () => {
      return ensureUser(adminToken, {
        name: 'Supervisor User',
        email: SUP_EMAIL,
        password: SUP_PASSWORD,
        role: 'supervisor',
      });
    });

    const { runId, staffToken } = await prepareRunWithEntries({ adminToken, staffUser });

    const supervisorToken = await runStep('Login Supervisor', async () => {
      return login(SUP_EMAIL, SUP_PASSWORD);
    });

    await runStep('Approve without verifier (should fail)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${supervisorToken}` } }
      );
      if (![400, 403].includes(res.status)) {
        throw new Error(`Expected 400/403, got ${res.status}`);
      }
    });

    await runStep('Assign Verifier (supervisor)', async () => {
      const res = await client.patch(
        `/runs/${runId}`,
        { verified_by: supervisorUser.id },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.status !== 200) throw new Error(`Set verifier failed: ${res.status}`);
    });

    await runStep('Staff approve (should fail)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
      if (![400, 403].includes(res.status)) {
        throw new Error(`Expected 400/403, got ${res.status}`);
      }
    });

    await runStep('Supervisor approve (should pass)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${supervisorToken}` } }
      );
      if (res.status !== 200) throw new Error(`Approve failed: ${res.status}`);
    });

    await runStep('Verify Run Status', async () => {
      const res = await client.get(`/runs/${runId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Run recheck failed: ${res.status}`);
      const payload = unwrap(res.data);
      if (payload.work_status !== 'approved') {
        throw new Error(`Expected work_status approved, got ${payload.work_status}`);
      }
    });

    console.log('\n✅ APPROVAL AUTH FLOW PASSED');
    expect(true).toBe(true);
  });

  it.skipIf(!shouldRun)('rejects approve when not in needs_review', async () => {
    console.log(`🚀 Starting Wrong-Status Approve Flow against ${API_BASE_URL}`);

    const adminToken = await runStep('Login Admin', async () => {
      return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    const staffUser = await runStep('Ensure Staff User', async () => {
      return ensureUser(adminToken, {
        name: 'Staff User',
        email: STAFF_EMAIL,
        password: STAFF_PASSWORD,
        role: 'staff',
      });
    });

    const supervisorUser = await runStep('Ensure Supervisor User', async () => {
      return ensureUser(adminToken, {
        name: 'Supervisor User',
        email: SUP_EMAIL,
        password: SUP_PASSWORD,
        role: 'supervisor',
      });
    });

    const { runId } = await prepareRunAssigned({ adminToken, staffUser });

    await runStep('Assign Verifier (supervisor)', async () => {
      const res = await client.patch(
        `/runs/${runId}`,
        { verified_by: supervisorUser.id },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.status !== 200) throw new Error(`Set verifier failed: ${res.status}`);
    });

    const supervisorToken = await runStep('Login Supervisor', async () => {
      return login(SUP_EMAIL, SUP_PASSWORD);
    });

    await runStep('Approve in wrong status (should fail)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${supervisorToken}` } }
      );
      if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}`);
      }
    });

    await runStep('Verify Run Not Approved', async () => {
      const res = await client.get(`/runs/${runId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Run recheck failed: ${res.status}`);
      const payload = unwrap(res.data);
      if (payload.work_status === 'approved') {
        throw new Error('Run should not be approved yet');
      }
    });

    console.log('\n✅ WRONG-STATUS APPROVE FLOW PASSED');
    expect(true).toBe(true);
  });

  it.skipIf(!shouldRun)('handles multi-item + multi-column entries', async () => {
    console.log(`🚀 Starting Multi-Entry Flow against ${API_BASE_URL}`);

    const adminToken = await runStep('Login Admin', async () => {
      return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    const staffUser = await runStep('Ensure Staff User', async () => {
      return ensureUser(adminToken, {
        name: 'Staff User',
        email: STAFF_EMAIL,
        password: STAFF_PASSWORD,
        role: 'staff',
      });
    });

    const area = await runStep('Create Area', async () => {
      return createArea(adminToken, `Khu Test Entries ${Date.now()}`);
    });

    const template = await runStep('Create Template (3 items, 3 columns)', async () => {
      return createTemplate(adminToken, area.id, { itemsCount: 3, columnsCount: 3 });
    });

    const runId = await runStep('Create Run', async () => {
      const id = await createRun(adminToken, area.id, template.id);
      if (!id) throw new Error('No run id returned');
      return id;
    });

    await runStep('Assign Run to Staff', async () => {
      const res = await client.patch(
        `/runs/${runId}`,
        { assigned_to: staffUser.id },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.status !== 200) throw new Error(`Assign run failed: ${res.status}`);
    });

    const staffToken = await runStep('Login Staff', async () => {
      return login(STAFF_EMAIL, STAFF_PASSWORD);
    });

    const runDetail = await runStep('Get Run Detail', async () => {
      const res = await client.get(`/runs/${runId}`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      if (res.status !== 200) throw new Error(`Run detail failed: ${res.status}`);
      return unwrap(res.data);
    });

    const items = runDetail.items || [];
    const columns = runDetail.template?.columns || [];
    if (items.length < 3 || columns.length < 3) {
      throw new Error(`Expected >=3 items/columns, got items=${items.length}, columns=${columns.length}`);
    }

    await runStep('Submit Entries (all combos)', async () => {
      for (const item of items.slice(0, 3)) {
        for (const column of columns.slice(0, 3)) {
          const res = await client.put(
            '/entries',
            {
              run_id: runId,
              item_id: item.id,
              column_id: column.id,
              value: 'ok',
              note: 'Multi Entry',
            },
            { headers: { Authorization: `Bearer ${staffToken}` } }
          );
          if (res.status !== 200 && res.status !== 201) {
            throw new Error(`Entry submit failed: ${res.status}`);
          }
        }
      }
    });

    await runStep('Verify Entries Count', async () => {
      const res = await client.get(`/runs/${runId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Run recheck failed: ${res.status}`);
      const payload = unwrap(res.data);
      const entries = payload.entries || [];
      if (entries.length < 9) {
        throw new Error(`Expected >=9 entries, got ${entries.length}`);
      }
    });

    console.log('\n✅ MULTI-ENTRY FLOW PASSED');
    expect(true).toBe(true);
  });

  it.skipIf(!shouldRun)('allows manager approve without verifier', async () => {
    console.log(`🚀 Starting Manager Override Flow against ${API_BASE_URL}`);

    const adminToken = await runStep('Login Admin', async () => {
      return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    const staffUser = await runStep('Ensure Staff User', async () => {
      return ensureUser(adminToken, {
        name: 'Staff User',
        email: STAFF_EMAIL,
        password: STAFF_PASSWORD,
        role: 'staff',
      });
    });

    const { runId, staffToken } = await prepareRunWithEntries({ adminToken, staffUser });

    await runStep('Manager approve without verifier', async () => {
      const res = await client.post(
        `/review/runs/${runId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.status !== 200) throw new Error(`Approve failed: ${res.status}`);
    });

    await runStep('Verify Run Approved', async () => {
      const res = await client.get(`/runs/${runId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Run recheck failed: ${res.status}`);
      const payload = unwrap(res.data);
      if (payload.work_status !== 'approved') {
        throw new Error(`Expected work_status approved, got ${payload.work_status}`);
      }
    });

    console.log('\n✅ MANAGER OVERRIDE FLOW PASSED');
    expect(true).toBe(true);
  });

  it.skipIf(!shouldRun)('rejects approve before complete', async () => {
    console.log(`🚀 Starting Approve-Before-Complete Flow against ${API_BASE_URL}`);

    const adminToken = await runStep('Login Admin', async () => {
      return login(ADMIN_EMAIL, ADMIN_PASSWORD);
    });

    const staffUser = await runStep('Ensure Staff User', async () => {
      return ensureUser(adminToken, {
        name: 'Staff User',
        email: STAFF_EMAIL,
        password: STAFF_PASSWORD,
        role: 'staff',
      });
    });

    const supervisorUser = await runStep('Ensure Supervisor User', async () => {
      return ensureUser(adminToken, {
        name: 'Supervisor User',
        email: SUP_EMAIL,
        password: SUP_PASSWORD,
        role: 'supervisor',
      });
    });

    const { runId } = await prepareRunAssigned({ adminToken, staffUser });

    const staffToken = await runStep('Login Staff', async () => {
      return login(STAFF_EMAIL, STAFF_PASSWORD);
    });

    await runStep('Start Work (staff)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/start`,
        {},
        { headers: { Authorization: `Bearer ${staffToken}` } }
      );
      if (res.status !== 200) throw new Error(`Start work failed: ${res.status}`);
    });

    await runStep('Assign Verifier (supervisor)', async () => {
      const res = await client.patch(
        `/runs/${runId}`,
        { verified_by: supervisorUser.id },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (res.status !== 200) throw new Error(`Set verifier failed: ${res.status}`);
    });

    const supervisorToken = await runStep('Login Supervisor', async () => {
      return login(SUP_EMAIL, SUP_PASSWORD);
    });

    await runStep('Approve before complete (should fail)', async () => {
      const res = await client.post(
        `/review/runs/${runId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${supervisorToken}` } }
      );
      if (res.status !== 400) {
        throw new Error(`Expected 400, got ${res.status}`);
      }
    });

    await runStep('Verify Run Still In Progress', async () => {
      const res = await client.get(`/runs/${runId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Run recheck failed: ${res.status}`);
      const payload = unwrap(res.data);
      if (payload.work_status !== 'in_progress') {
        throw new Error(`Expected work_status in_progress, got ${payload.work_status}`);
      }
    });

    console.log('\n✅ APPROVE-BEFORE-COMPLETE FLOW PASSED');
    expect(true).toBe(true);
  });
});
