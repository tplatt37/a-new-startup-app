const { resolveInclude } = require("ejs");
const supertest = require("supertest");
const request = require("supertest");
const app = require("../src/app");

const os = require('os');



describe("Test the root path", () => {
  
  test("It should respond(200) to the GET method", done => {
    request(app)
      .get("/")
      .then(response => {
        expect(response.statusCode).toBe(200);
        done();
      });
  });
});

describe("Test the static path", () => {
    test("It should respond(200) to the GET method", done => {
      request(app)
        .get("/static/bootstrap/css/theme/amelia/bootstrap.css")
        .then(response => {
          expect(response.statusCode).toBe(200);
          done();
        });
    });
});

describe("Test 404", () => {
    test("It should respond to the GET method with 404 Not Found", done => {
      request(app)
        .get("/index.html")
        .then(response => {
          expect(response.statusCode).toBe(404);
          done();
        });
    });
});

// This is more of an integration test - as it requires DynamoDB to be accessible and you 
// must have an Access Key/Secret Access Key or otherwise to have permissions (in CodeBuild) 
// It's probably best to leave these type of tests to an environment where you can easily utilize a role
// For example, run integration tests via ECS task and use a Task Role that will have the necessary permissions.
// describe("Test POST", () => {

//   test("Testing a POST", done => {

//     supertest(app)
//       .post("/signup")
//       .set('Content-Type', 'application/x-www-form-urlencoded')
//       .send(
//         {
//           theme: "flatly",
//           name: "Test",
//           email: "test@example.com",
//           previewAccess: "Yes"
//         }
//       )
//       .then( response => {
//         expect(response.statusCode).toBe(409);
//         done();
//       });
//   });
// });
