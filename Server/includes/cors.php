<?php

/*
example of the logic flow of a request from React to the PHP API:
React
   ↓
getHero()
   ↓
hero.php
   ↓
cors.php  ← allows the request
   ↓
db.php    ← connects to MySQL
   ↓
JSON response
   ↓
React

*/

// allows React to make requests to the PHP API
// even though React and PHP are running on different origins.
header("Access-Control-Allow-Origin: *");

// tells the browser that the API response is JSON
// and uses UTF-8 character encoding.
header("Content-Type: application/json; charset=utf-8");
