// tests/user.test.js
const it = require("ava").default;
const chai = require("chai");
var expect = chai.expect;
const startDB = require('../helpers/DB');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { addUser, getUsers, getSingleUser, deleteUser } = require('../index');
const User = require('../models/user');
const sinon = require("sinon");
const utils = require('../helpers/utils');

let mongod;

it.before(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGOURI = mongod.getUri('cloudUnitTesting');
    await startDB();
});

it.after(async () => {
    await mongod.stop({ doCleanUp: true });
});

it("Create User Successfully", async (t) => {
    const request = {
        body: {
            firstName: "Nada",
            lastName: "Khater",
            age: 23,
            job: "DevOps",
        },
    };
    const expectedResult = {
        fullName: "Nada Khater",
        age: 23,
        job: "DevOps",
    };
    sinon.stub(utils, 'getFullName').callsFake((fname, lname) => {
        expect(fname).to.be.equal(request.body.firstName);
        expect(lname).to.be.equal(request.body.lastName);
        return 'Nada Khater';
    });
    const actualResult = await addUser(request);
    const result = {
        ...expectedResult,
        __v: actualResult.__v,
        _id: actualResult._id
    };
    expect(actualResult).to.be.a('object');
    expect(actualResult._doc).to.deep.equal(result);
    t.teardown(async () => {
        await User.deleteMany({
            fullName: request.body.fullName,
        });
    });
    t.pass();
});

// ===================================== \ Get Users Test Case / =====================================
it("Get All Users Successfully", async (t) => {
    const users = [
        { fullName: "Nada Khater", age: 23, job: "DevOps" },
        { fullName: "Reham Khater", age: 25, job: "Backend" },
    ];
    await User.insertMany(users);

    const actualResult = await getUsers({});
    expect(actualResult).to.be.an('array');
    expect(actualResult).to.have.lengthOf(users.length);

    actualResult.forEach((user, i) => {
        expect(user.fullName).to.equal(users[i].fullName);
        expect(user.age).to.equal(users[i].age);
        expect(user.job).to.equal(users[i].job);
    });

    t.teardown(async () => {
        await User.deleteMany({});
    });

    t.pass();
});


// ===================================== \ Get Single User Test Case / =====================================
it("Get Single User Successfully", async (t) => {
    const user = { fullName: "Reham Khater", age: 25, job: "Backend" };
    const newUser = await User.create(user);

    const actualuser = await getSingleUser({ params: { id: newUser._id } });
    expect(actualuser).to.be.an('object');
    
    expect(actualuser.fullName).to.equal(user.fullName);
    expect(actualuser.age).to.equal(user.age);
    expect(actualuser.job).to.equal(user.job);

    t.teardown(async () => {
        await User.deleteMany({});
    });

    t.pass();
});


// ===================================== \ Delete User Test Case / =====================================
it("Delete User Successfully", async (t) => {
    const user = { fullName: "Nada Khater", age: 23, job: "DevOps" };
    const newUser = await User.create(user);

    await deleteUser({ params: { id: newUser._id } });

    const deletedUser = await User.findById(newUser._id);
    expect(deletedUser).to.be.null;

    t.teardown(async () => {
        await User.deleteMany({});
    });

    t.pass();
});
