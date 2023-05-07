const endpoint = `${process.env.HOSTNAME}:${process.env.API_PORT}/api`;
const exp = require('constants');
const supertest = require('supertest')

const request = supertest(endpoint);

describe("Testing GET routes for /requests endpoint", () => {
  const uniqueID = 999999;
  let documentID;
  // Insert an entry so there's something to get
  beforeAll(async () => {
    const response = await request.post("/requests").send({
      data: {
        lateEntry: false,
        idir: "W0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A1",
        firstName: "John",
        lastName: "Smith",
        employeeId: uniqueID,
        itemsPurchased: [
          "Dogs"
        ],
        totalCost: 45.46,
        purchaseDate: "2023-04-05T00:00:00-07:00",
        attachReceipts: [
          {
            storage: 'chefs',
            url: 'some/link',
            size: 9001,
            data: {
              id: 'fe0000'
            },
            originalName: 'file.pdf'
          }
        ],
        approvalDate: "2023-04-13T00:00:00-07:00",
        attachApproval: [
          {
            storage: 'chefs',
            url: 'some/link',
            size: 9001,
            data: {
              id: 'fe0000'
            },
            originalName: 'file.pdf'
          }
        ],
        supplierName: "Jimmy's Dogs",
        supplierPhoneNumber: "(324) 324-2342",
        supplierEmail: "jimmys@yahoo.com",
        additionalComments: "Great purchase!",
        submit: true,
      }
    });
    documentID = response.body._id;
  })

  test("Document is retrieved from base route", async () => {
    const response = await request.get("/requests");
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    // At least a single value should be returned.
    expect(response.body.length).toBeGreaterThan(0);
    // Most recent value should have all non-minimal property employeeId
    const mostRecent = response.body.find(obj => obj._id = documentID);
    expect(mostRecent.employeeId).toBeTruthy();
  });

  test("Document is retrieved from base route with minimal properties", async () => {
    const response = await request.get("/requests").query({ minimal: true });
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    // At least a single value should be returned.
    expect(response.body.length).toBeGreaterThan(0);
    // Most recent value should be the one we submitted.
    const mostRecent = response.body.find(obj => obj._id = documentID);
    // Minimal properties shouldn't include employeeID.
    expect(mostRecent.employeeId).toBeFalsy();
  });

  test("Document is retrieved from IDIR-specific query", async () => {
    const response = await request.get("/requests/idir").query({ idir: "W0A0A0A0A0A0A0A0A0A0A0A0A0A0A0A1" });
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    // At least a single value should be returned.
    expect(response.body.length).toBeGreaterThan(0);
    // Most recent value should be the one we submitted.
    const mostRecent = response.body.find(obj => obj._id = documentID);
    expect(mostRecent.employeeId).toBe(uniqueID);
  });

  test("No documents are returned when the IDIR provided doesn't exist", async () => {
    const response = await request.get("/requests/idir").query({ idir: "1111111111" });
    expect(response.status).toBe(404);
  });

  test("Document is retrieved from ID-specific query", async () => {
    const response = await request.get(`/requests/${documentID}`);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    // It matches the employee ID we provided
    expect(response.body.employeeId).toBe(uniqueID);
  });

  test("No document returned when ID provided doesn't exist", async () => {
    const response = await request.get(`/requests/6453d4371d73f4c66c983618`);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });

  test("400 code returned if ID doesn't match schema", async () => {
    const response = await request.get(`/requests/111`);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });
});