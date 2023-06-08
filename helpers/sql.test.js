const jwt = require("jsonwebtoken");
const { sqlForPartialUpdate } = require("./sql");
const { SECRET_KEY } = require("../config");

describe("change json queryable sql", function () {
  test("works ", function () {
    const dataToUpdate = { firstName: "Aliya", age: 32 };
    const jsToSql = { firstName: "first_name" };
    const sqlVals = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(sqlVals).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32],
    });
  });
});
