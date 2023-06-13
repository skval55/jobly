const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
// This function takes an ordinary javaScript object and makes and
// an array with query able strings example
// {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
// it will return the queryable strings along with an array of the values
// in a object

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}
// query = {name:"someName", minEmployees:num, maxEmployees:num}
function queryToSql(query) {
  const sql = [];

  if (query.name) {
    query.name = `%${query.name}%`;
    const num = sql.length + 1;
    sql.push(`LOWER("name") LIKE LOWER($${num})`);
  }
  if (query.maxEmployees) {
    if (query.minEmployees && query.minEmployees > query.maxEmployees) {
      throw new BadRequestError("Minimum Employees > Max Employees");
    }
    const num = sql.length + 1;
    const num2 = sql.length + 2;
    sql.push(
      `"num_employees" BETWEEN ${
        query.minEmployees ? `$${num2}` : 0
      } AND $${num} `
    );
  } else if (query.minEmployees) {
    const num = sql.length + 1;
    sql.push(`"num_employees" >= $${num}`);
  }
  return {
    setCols: sql.join(", "),
    values: Object.values(query).sort((a, b) => b - a),
  };
}

/** function to make SQL queryable string from the jobs url
 *
 */
function queryToSqlJobs(query) {
  const sql = [];
  if (query.title) {
    query.title = `%${query.title}%`;
    const num = sql.length + 1;
    sql.push(`LOWER("title") LIKE LOWER($${num})`);
  }
  if (query.minSalary) {
    const num = sql.length + 1;
    sql.push(`"salary" >= $${num}`);
  }
  if (query.hasEquity && query.hasEquity == true) {
    sql.push(`"equity" > 0`);
    delete query.hasEquity;
  }
  return {
    setCols: sql.join(", "),
    values: Object.values(query),
  };
}

module.exports = { sqlForPartialUpdate, queryToSql, queryToSqlJobs };
