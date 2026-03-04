import { test, describe } from 'node:test';
import assert from 'node:assert';
import worker from './worker.js';

describe('worker.js tests', () => {
  describe('POST /api/save', () => {
    test('successful save (happy path)', async () => {
      let queryRun = false;
      let kvDeleted = false;
      const mockDb = {
        prepare: (query) => {
          assert.ok(query.includes('INSERT INTO RoomState'));
          return {
            bind: (...args) => {
              assert.deepStrictEqual(args, ['item-1', 'room-1', 'block', 100, 200]);
              return {
                run: async () => {
                  queryRun = true;
                  return { success: true };
                }
              };
            }
          };
        }
      };
      const mockKv = {
        delete: async (key) => {
          assert.strictEqual(key, 'room:room-1');
          kvDeleted = true;
        }
      };
      const env = { DB: mockDb, KV: mockKv };

      const request = new Request('http://localhost/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'item-1',
          roomId: 'room-1',
          type: 'block',
          x: 100,
          y: 200
        })
      });

      const response = await worker.fetch(request, env);
      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get('Content-Type'), 'application/json');
      const data = await response.json();
      assert.deepStrictEqual(data, { success: true });
      assert.ok(queryRun, 'Database query should have been run');
      assert.ok(kvDeleted, 'KV cache should have been invalidated');
    });

    test('missing required fields (400 Bad Request)', async () => {
      const env = {};
      const request = new Request('http://localhost/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'item-1'
          // missing roomId, type, x, y
        })
      });

      const response = await worker.fetch(request, env);
      assert.strictEqual(response.status, 400);
      const text = await response.text();
      assert.strictEqual(text, 'Missing required fields');
    });

    test('database error (500 Internal Server Error)', async () => {
      const mockDb = {
        prepare: (query) => ({
          bind: (...args) => ({
            run: async () => {
              throw new Error('Database connection failed');
            }
          })
        })
      };
      const env = { DB: mockDb };

      const request = new Request('http://localhost/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'item-1',
          roomId: 'room-1',
          type: 'block',
          x: 100,
          y: 200
        })
      });

      const response = await worker.fetch(request, env);
      assert.strictEqual(response.status, 500);
      assert.strictEqual(response.headers.get('Content-Type'), 'application/json');
      const data = await response.json();
      assert.strictEqual(data.error, 'Database connection failed');
    });
  });
});
