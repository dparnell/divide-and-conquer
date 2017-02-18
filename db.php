<?php

$db_file = $dir = dirname(__FILE__)."/db/database.sqlite3";
$create_db = !file_exists($db_file);

$db = new SQLite3($db_file);
if($create_db) {
    $db->exec("create table results (name varchar(255), divide_by integer, number_correct integer, time_taken real, results text, inserted_at integer)");
    $db->exec("create index by_divide_by on results (divide_by)");
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, TRUE);

    if(isset($data["player_name"]) && isset($data["table"]) && isset($data["correct_count"]) && isset($data["total_time"])) {
        $s = $db->prepare("insert into results(name, divide_by, number_correct, time_taken, results, inserted_at) values (:name, :divide_by, :number_correct, :time_taken, :results, :now)");
        $s->bindValue("name", $data["player_name"], SQLITE3_TEXT);
        $s->bindValue("divide_by", $data["table"], SQLITE3_INTEGER);
        $s->bindValue("number_correct", $data["correct_count"], SQLITE3_INTEGER);
        $s->bindValue("time_taken", $data["total_time"], SQLITE3_FLOAT);
        $s->bindValue("results", $raw, SQLITE3_TEXT);
        $s->bindValue("now", time(), SQLITE3_INTEGER);
        $s->execute();
        $s->close();

        echo("OK");
    } else {
        echo("NOPE");
    }
} else {
}

$db->close();

?>
