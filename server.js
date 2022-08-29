const mysql = require('mysql');
const express = require('express');
var app = express();
const axios = require('axios')

//add database configurations here
var mysqlConnection = mysql.createConnection({
   host: '',
   user: '',
   password: '',
   database: 'task'
});

// connect to mysql
mysqlConnection.connect((err) => {
   if (!err)
      console.log('connection succeded');
   else
      console.log('DB connection failed \n Error:' + JSON.stringify(err));

});


const dataList = [];

const Count = 10; //specify the length how how much data to be inserted in db

async function fetchAllData() {
   try {
      const fetchURL = `https://randomuser.me/api`;
      const response = await axios.get(fetchURL);
      if (response.data.results) {
         let responseData = response.data.results[0]
         if (dataList.filter(e => e.uuid === responseData.login.uuid).length === 0) {
            let userObject = {
               uuid: responseData.login.uuid,
               first_name: responseData.name.first,
               dob: responseData.dob.date,
               street_number: responseData.location.street.name,
               last_name: responseData.name.last,
               phone_no: responseData.phone + ',' + responseData.cell,
               email: responseData.email,
               city: responseData.location.city
            }
            let insertQueryPerson = "INSERT INTO person (uuid, first_name, last_name, dob) VALUES (?,?,?,?)";
            let insertQueryAddress = "INSERT INTO address (person_id, street_number, city) VALUES ((select person_id from person where uuid=?),?,?)";
            let insertQueryPhone = "INSERT INTO phone (person_id,phone_no) VALUES ((select person_id from person where uuid=?),?)";
            let insertEmailQuery = "INSERT INTO email (person_id,email) VALUES ((select person_id from person where uuid=?),?)"
            mysqlConnection.query(insertQueryPerson, [userObject.uuid, userObject.first_name, userObject.last_name, userObject.dob], (err, rows, fields) => {
               if (!err) {
                  mysqlConnection.query(insertQueryAddress, [userObject.uuid, userObject.street_number, userObject.city], (err, rows, fields) => {
                     if (!err) {
                        mysqlConnection.query(insertQueryPhone, [userObject.uuid, userObject.phone_no], (err, rows, fields) => {
                           if (!err) {
                              mysqlConnection.query(insertEmailQuery, [userObject.uuid, userObject.email], (err, rows, fields) => {
                                 if (!err) {
                                    console.log("data inserted");
                                 }
                                 else
                                    console.log(err);
                              })
                           }
                           else
                              console.log(err);
                        })

                     }
                     else
                        console.log(err);
                  })
               }
               else
                  console.log(err);
            })
            dataList.push(userObject)
         }
      }
      if (
         dataList.length <= Count
      ) {
         await new Promise((resolve) => setTimeout(resolve, 0));
         return await fetchAllData();
      }
      console.clear();
   } catch (err) {
      console.error(err);
   }
}

fetchAllData();


var server = app.listen(8081, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("Example app listening at http://%s:%s", host, port)
});