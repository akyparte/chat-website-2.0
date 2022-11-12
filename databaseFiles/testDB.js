const config = require("../config");
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
  }
);
(async function () {
  try {
    await sequelize.authenticate();
    console.log("connection has been established");
  } catch {
    console.log("error occured");
  }
})();

let Users = sequelize.define(
  "Users",
  {
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    userid: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["userid"],
      },
    ],
    timestamps: false,
  }
);
Users.removeAttribute("id");

(async function () {
  await Users.sync({ force: true });

  // await Users.create({
  //   username: "abc",
  //   userid: "auhujbibc",
  //   password: "jjj",
  //   email: "djnj",
  // });

  // await Users.create({
  //   username: "abc",
  //   userid: "auhuibc",
  //   password: "jjj",
  //   email: "djnj",
  // });


  let user = await Users.findAll({
    where: { username: "abc" },
  });
     console.log(user)

})();
