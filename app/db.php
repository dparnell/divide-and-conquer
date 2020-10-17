<?php

$db_file = $dir = dirname(__FILE__)."/db/database.sqlite3";
$create_db = !file_exists($db_file);

$db = new SQLite3($db_file);
if($create_db) {
    $db->exec("create table results (id integer primary key, name varchar(255), divide_by integer, number_correct integer, time_taken real, inserted_at integer)");
    $db->exec("create index by_divide_by on results (divide_by)");

    $db->exec("create table answers (id integer primary key, result_id integer, value_1 integer, value_2 integer, operation varchar(255), given_answer integer, correct_answer integer, time_taken real)");
    $db->exec("create index answer_by_result_id on answers (result_id)");
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, TRUE);

    if(isset($data["player_name"]) && isset($data["table"]) && isset($data["correct_count"]) && isset($data["total_time"])) {
        $s = $db->prepare("insert into results(name, divide_by, number_correct, time_taken, inserted_at) values (:name, :divide_by, :number_correct, :time_taken, :now)");
        $s->bindValue("name", $data["player_name"], SQLITE3_TEXT);
        $s->bindValue("divide_by", $data["table"], SQLITE3_INTEGER);
        $s->bindValue("number_correct", $data["correct_count"], SQLITE3_INTEGER);
        $s->bindValue("time_taken", $data["total_time"], SQLITE3_FLOAT);
        $s->bindValue("now", time(), SQLITE3_INTEGER);
        $s->execute();
        $id = $db->lastInsertRowID();
        $s->close();

        $s = $db->prepare("insert into answers(result_id, value_1, value_2, operation, given_answer, correct_answer, time_taken) values (:result_id, :value_1, :value_2, :operation, :given_answer, :correct_answer, :time_taken)");
        $s->bindValue("result_id", $id, SQLITE3_INTEGER);

        $answers = $data["results"];
        foreach($answers as $answer) {
            $s->bindValue("value_1", $answer["value_1"], SQLITE3_INTEGER);
            $s->bindValue("value_2", $answer["value_2"], SQLITE3_INTEGER);
            $s->bindValue("operation", $answer["operation"], SQLITE3_TEXT);
            $s->bindValue("given_answer", $answer["given_answer"], SQLITE3_INTEGER);
            $s->bindValue("correct_answer", $answer["correct_answer"], SQLITE3_INTEGER);
            $s->bindValue("time_taken", $answer["time_taken"], SQLITE3_FLOAT);
            $s->execute();
        }

        $s->close();
    }
}

$args = null;
$result_type = SQLITE3_NUM;
if(array_key_exists("q", $_REQUEST)) {
    $op = $_REQUEST["q"];
    if($op == "names") {
        $sql = "select distinct name from results order by name";
    } else if($op == "tables") {
        $sql = "select distinct divide_by from results order by divide_by";
    } else if($op == "all_student_table_summary") {
        $sql = "select id, name, number_correct, time_taken, inserted_at from results where divide_by=:divide_by order by trim(upper(name)), inserted_at";
        $result_type = SQLITE3_ASSOC;
        $args = array("divide_by" => $_REQUEST["table"]);
    } else {
        trigger_error("Invalid operation", E_USER_ERROR);
    }

} else {
    $sql = "select * from (select divide_by, name, time_taken from results where divide_by=1 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=2 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=3 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=4 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=5 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=6 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=7 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=8 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=9 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=10 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=11 and number_correct=13 order by time_taken asc limit 5) a
union all
select * from (select divide_by, name, time_taken from results where divide_by=12 and number_correct=13 order by time_taken asc limit 5) a
order by divide_by asc, time_taken asc";
}

$result = [];
if($args == null) {
    $rs = $db->query($sql);
} else {
    $s = $db->prepare($sql);
    foreach($args as $k => $v) {
        $s->bindValue($k, $v, SQLITE3_TEXT);
    }
    $rs = $s->execute();
}

while ($row = $rs->fetchArray($result_type)) {
    array_push($result, $row);
}

header("Content-Type: text/json");
echo(json_encode($result));

$db->close();

?>
