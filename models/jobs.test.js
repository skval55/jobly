"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 100000,
    equity: "0",
    company_handle: "c1",
  };

  test("works", async function () {
    const job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(`
    SELECT title, salary, equity, company_handle
    FROM jobs WHERE title = 'new'
    `);
    expect(result.rows[0]).toEqual({
      title: "new",
      salary: 100000,
      equity: "0",
      company_handle: "c1",
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    const result = await Job.findAll();
    expect(result).toEqual([
      {
        title: "j1",
        salary: 10000,
        equity: "0",
        company_handle: "c1",
      },
      {
        title: "j2",
        salary: 100000,
        equity: "0.5",
        company_handle: "c2",
      },
      {
        title: "j3",
        salary: 50000,
        equity: "0.9",
        company_handle: "c3",
      },
    ]);
  });
});

/************************************** using query string */

describe("using query string", function () {
  test("query test with name", async function () {
    const query = { title: "j2" };
    const result = await Job.searchQuery(query);
    expect(result).toEqual([
      {
        title: "j2",
        salary: 100000,
        equity: "0.5",
        company_handle: "c2",
      },
    ]);
  });
  test("query test with salary", async function () {
    const query = { minSalary: 40000 };
    const result = await Job.searchQuery(query);
    expect(result).toEqual([
      {
        title: "j2",
        salary: 100000,
        equity: "0.5",
        company_handle: "c2",
      },
      {
        title: "j3",
        salary: 50000,
        equity: "0.9",
        company_handle: "c3",
      },
    ]);
  });
  test("query test with equity", async function () {
    const query = { hasEquity: "true" };
    const result = await Job.searchQuery(query);
    expect(result).toEqual([
      {
        title: "j2",
        salary: 100000,
        equity: "0.5",
        company_handle: "c2",
      },
      {
        title: "j3",
        salary: 50000,
        equity: "0.9",
        company_handle: "c3",
      },
    ]);
  });
  test("query test with name, salary", async function () {
    const query = { title: "2", minSalary: 40000 };
    const result = await Job.searchQuery(query);
    expect(result).toEqual([
      {
        title: "j2",
        salary: 100000,
        equity: "0.5",
        company_handle: "c2",
      },
    ]);
  });
});

/************************************** findJob */

describe("get job by id", function () {
  test("works", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);

    let job = await Job.findJob(jobResult.rows[0].id);
    expect(job).toEqual({
      title: "j1",
      salary: 10000,
      equity: "0",
      company_handle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.findJob(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const newJob = {
    title: "new",
    salary: 10000,
    equity: "0",
    company_handle: "c1",
  };
  const newJobNull = {
    title: "new",
    salary: null,
    equity: null,
    company_handle: "c1",
  };
  test("works", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);
    let job = await Job.update(jobResult.rows[0].id, newJob);
    expect(job).toEqual({
      id: jobResult.rows[0].id,
      title: "new",
      salary: 10000,
      equity: "0",
      company_handle: "c1",
    });
  });
  test("works: null fields", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);
    let job = await Job.update(jobResult.rows[0].id, newJobNull);
    expect(job).toEqual({
      id: jobResult.rows[0].id,
      title: "new",
      salary: null,
      equity: null,
      company_handle: "c1",
    });
  });
  test("not found if no such job", async function () {
    try {
      await Job.update(0, newJob);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
  test("bad request with no data", async function () {
    try {
      const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
      let jobResult = await db.query(jobQuery);
      let job = await Job.update(jobResult.rows[0].id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

// /************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const jobQuery = `SELECT id, title FROM jobs WHERE title = 'j1'`;
    let jobResult = await db.query(jobQuery);
    await Job.remove(jobResult.rows[0].id);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id=${jobResult.rows[0].id}`
    );
    expect(res.rows.length).toEqual(0);
  });
  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
