const validateEmail = require("../src/validator");

describe("Test the basic email success", () => {
  test("It should respond true", done => {
    expect(validateEmail("test@example.com")).toBe(true);
    done();
  });
});

describe("Test bad email failure", () => {
    test("It should respond false", done => {
      expect(validateEmail("test@example@com")).toBe(false);
      done();
    });
});