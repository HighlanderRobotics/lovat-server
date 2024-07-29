require('dotenv').config();

test('database host should be localhost', () => {
  expect(process.env.DB_HOST).toBe('localhost');
});
