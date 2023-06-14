"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");
const Job = require("./jobs.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 150000,
    equity: 0,
    company_handle: "c1",
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        title: "new",
        salary: 150000,
        equity: "0",
        company_handle: "c1",
      },
    });
  });
  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 10,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "new",
        salary: 150000,
        equity: 0,
        company_handle: 21,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
  test("non admin cannot", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j1",
          salary: 100000,
          equity: "0",
          company_handle: "c1",
        },
        {
          title: "j2",
          salary: 20000,
          equity: "0.5",
          company_handle: "c3",
        },
        {
          title: "j3",
          salary: 200000,
          equity: null,
          company_handle: "c3",
        },
      ],
    });
  });
  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** Get /jobs/query */

describe("GET /jobs/query", function () {
  test("search filter for name", async function () {
    const resp = await request(app).get("/jobs?title=j1");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j1",
          salary: 100000,
          equity: "0",
          company_handle: "c1",
        },
      ],
    });
  });
  test("search filter for salary", async function () {
    const resp = await request(app).get("/jobs?minSalary=50000");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j1",
          salary: 100000,
          equity: "0",
          company_handle: "c1",
        },
        {
          title: "j3",
          salary: 200000,
          equity: null,
          company_handle: "c3",
        },
      ],
    });
  });
  test("search filter for equity", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j2",
          salary: 20000,
          equity: "0.5",
          company_handle: "c3",
        },
      ],
    });
  });
  test("search filter for equity and salary", async function () {
    const resp = await request(app).get("/jobs?hasEquity=true&minSalary=10000");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "j2",
          salary: 20000,
          equity: "0.5",
          company_handle: "c3",
        },
      ],
    });
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);

    const resp = await request(app).get(`/jobs/${jobResult.rows[0].id}`);
    expect(resp.body).toEqual({
      job: {
        title: "j1",
        salary: 100000,
        equity: "0",
        company_handle: "c1",
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
  test("works for admins", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);

    const resp = await request(app)
      .patch(`/jobs/${jobResult.rows[0].id}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: jobResult.rows[0].id,
        title: "j1-new",
        salary: 100000,
        equity: "0",
        company_handle: "c1",
      },
    });
  });

  test("unauth for anon", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);

    const resp = await request(app)
      .patch(`/jobs/${jobResult.rows[0].id}`)
      .send({
        title: "j1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non admin", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);

    const resp = await request(app)
      .patch(`/jobs/${jobResult.rows[0].id}`)
      .send({
        title: "j1-new",
      })
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
      .patch(`/jobs/0`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);

    const resp = await request(app)
      .patch(`/jobs/${jobResult.rows[0].id}`)
      .send({
        company_handle: "c1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);

    const resp = await request(app)
      .patch(`/jobs/${jobResult.rows[0].id}`)
      .send({
        salary: "not-a-number",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobss/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);

    const resp = await request(app)
      .delete(`/jobs/${jobResult.rows[0].id}`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${jobResult.rows[0].id}` });
  });

  test("unauth for anon", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);
    const resp = await request(app).delete(`/jobs/${jobResult.rows[0].id}`);
    expect(resp.statusCode).toEqual(401);
  });
  test("unauth for non admin", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);
    const resp = await request(app)
      .delete(`/jobs/${jobResult.rows[0].id}`)
      .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/0`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
