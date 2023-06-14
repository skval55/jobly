"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { queryToSqlJobs, sqlForPartialUpdate } = require("../helpers/sql");

/** functions related to jobs
 *
 */

class Job {
  /** Create Job
   *
   */
  static async create({ title, salary, equity, company_handle }) {
    const result = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
    VALUES ($1, $2, $3, $4)
        RETURNING title, salary, equity, company_handle`,
      [title, salary, equity, company_handle]
    );
    const job = result.rows[0];
    return job;
  }
  /** Find all jobs
   *
   */
  static async findAll() {
    const result = await db.query(`SELECT title, salary, equity, company_handle
    FROM jobs
    ORDER BY title`);
    return result.rows;
  }
  /** query select all jobs that fit parameters
   *
   */
  static async searchQuery(query) {
    const { setCols, values } = queryToSqlJobs(query);
    const querySql = `SELECT
                  title,
                  salary,
                  equity, 
                  company_handle
           FROM jobs
           WHERE ${setCols}
           ORDER BY title`;
    const result = await db.query(querySql, [...values]);
    return result.rows;
  }
  /** Return data about one company
   *
   */
  static async findJob(id) {
    const jobResult = await db.query(
      `SELECT title,
                    salary,
                    equity,
                    company_handle
                FROM jobs
                WHERE id = $1`,
      [id]
    );
    const job = jobResult.rows[0];
    if (!job) throw new NotFoundError(`No job with id: ${id}`);
    return job;
  }
  /** update data about one company
   *
   *    * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      companyHandle: "company_handle",
    });
    const idIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                    SET ${setCols}
                    WHERE id = ${idIdx}
                    RETURNING id,
                    title,
                    salary,
                    equity,
                    company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** delete one company
   *
   */
  static async remove(id) {
    const result = await db.query(
      `
    DELETE FROM jobs
    WHERE id = $1
    RETURNING id`,
      [id]
    );

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}

module.exports = Job;
