<?php

function customError($errno, $errstr, $errfile, $errline) {
    error_log("Error: [$errno $errfile: $errline] $errstr");
    echo "ERROR";
}
set_error_handler("customError");

$db_file = $dir = dirname(__FILE__)."/db/database.sqlite3";
$create_db = !file_exists($db_file);

$db = new SQLite3($db_file);
if($create_db) {
    $db->exec("create table results (id integer primary key, student_id integer, times_table integer, number_correct integer, time_taken real, inserted_at integer)");
    $db->exec("create index by_times_table on results (times_table)");

    $db->exec("create table answers (id integer primary key, result_id integer, value_1 integer, value_2 integer, operation varchar(255), given_answer integer, correct_answer integer, time_taken real)");
    $db->exec("create index answer_by_result_id on answers (result_id)");

    $db->exec("create table students(id integer primary key, first_name varchar(255), last_name varchar(255), cohort varchar(32))");
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, TRUE);

    if(isset($data["student_id"]) && isset($data["table"]) && isset($data["correct_count"]) && isset($data["total_time"])) {
        $s = $db->prepare("insert into results(student_id, times_table, number_correct, time_taken, inserted_at) values (:student_id, :times_table, :number_correct, :time_taken, :now)");
        $s->bindValue("student_id", $data["student_id"], SQLITE3_TEXT);
        $s->bindValue("times_table", $data["table"], SQLITE3_INTEGER);
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
} else {
    $data = $_REQUEST;
}

$args = null;
$result_type = SQLITE3_NUM;
if(array_key_exists("q", $_REQUEST)) {
    $op = $_REQUEST["q"];
    if($op == "db") {
        $fp = fopen($db_file, 'rb');
        header("Content-Type: application/x-sqlite3");
        header("Content-Length: " . filesize($db_file));
        header('Content-disposition: attachment; filename="data.sqlite3"');
        fpassthru($fp);
        exit;
    } else if($op == "login") {
        $sql = "select id from students where lower(first_name)=:first_name and lower(last_name)=:last_name and lower(cohort)=:cohort";
        $args = array(
            "first_name" => strtolower($_REQUEST["first_name"]),
            "last_name" => strtolower($_REQUEST["last_name"]),
            "cohort" => strtolower($_REQUEST["cohort"])
        );
    } else if($op == "cohorts") {
        $sql = "select distinct cohort from students order by cohort";
    } else if($op == "names") {
        $sql = "select id, first_name||' '||last_name from students where cohort=:cohort order by last_name, first_name";
        $args = array("cohort" => $_REQUEST["cohort"]);
    } else if($op == "tables") {
        $sql = "select distinct times_table from results order by times_table";
    } else if($op == "all_student_table_summary") {
        $result_type = SQLITE3_ASSOC;
        $sql = "select r.id, first_name||' '||last_name name, times_table, number_correct, time_taken, inserted_at from results r join students s on s.id=student_id where cohort=:cohort and times_table=:times_table order by last_name, first_name, inserted_at";
        $args = array("times_table" => $_REQUEST["table"], "cohort" => $_REQUEST["cohort"]);
    } else if($op == "student_table_summary") {
        $result_type = SQLITE3_ASSOC;
        if(array_key_exists("table", $_REQUEST)) {
            $table = $_REQUEST["table"];
            if($table == "+") {
                $fragment = " and (times_table>=1 and times_table<=10) ";
                $table = null;
            } else {
                $fragment = " and times_table=:table ";
            }
        } else {
            $table = null;
            $fragment = "";
        }
           
        $sql = "select id, times_table, number_correct, time_taken, inserted_at from results where student_id=:student_id ".$fragment." order by times_table, inserted_at";
        $args = array("student_id" => $_REQUEST["student_id"]);
        if($table != null) {
            $args["table"] = $table;
        }
    } else if($op == "all_tables_summary") {
        $result_type = SQLITE3_ASSOC;
        $sql = "select n.id as student_id, n.first_name||' '||n.last_name name, d1.correct as d01, d2.correct as d02, d3.correct as d03, d4.correct as d04, d5.correct as d05, d6.correct as d06,
d7.correct as d07, d8.correct as d08, d9.correct as d09, d10.correct as d10, d11.correct as d11, d12.correct as d12 from
(select id, first_name, last_name from students where cohort=:cohort) as n
left join (select student_id, max(number_correct) correct from results where times_table=1 group by student_id) as d1 on n.id=d1.student_id
left join (select student_id, max(number_correct) correct from results where times_table=2 group by student_id) as d2 on n.id=d2.student_id
left join (select student_id, max(number_correct) correct from results where times_table=3 group by student_id) as d3 on n.id=d3.student_id
left join (select student_id, max(number_correct) correct from results where times_table=4 group by student_id) as d4 on n.id=d4.student_id
left join (select student_id, max(number_correct) correct from results where times_table=5 group by student_id) as d5 on n.id=d5.student_id
left join (select student_id, max(number_correct) correct from results where times_table=6 group by student_id) as d6 on n.id=d6.student_id
left join (select student_id, max(number_correct) correct from results where times_table=7 group by student_id) as d7 on n.id=d7.student_id
left join (select student_id, max(number_correct) correct from results where times_table=8 group by student_id) as d8 on n.id=d8.student_id
left join (select student_id, max(number_correct) correct from results where times_table=9 group by student_id) as d9 on n.id=d9.student_id
left join (select student_id, max(number_correct) correct from results where times_table=10 group by student_id) as d10 on n.id=d10.student_id
left join (select student_id, max(number_correct) correct from results where times_table=11 group by student_id) as d11 on n.id=d11.student_id
left join (select student_id, max(number_correct) correct from results where times_table=12 group by student_id) as d12 on n.id=d12.student_id";
        $args = array("cohort" => $_REQUEST["cohort"]);
    } else if($op == "results") {
        $result_type = SQLITE3_ASSOC;
        $sql = "select * from answers where result_id=:id order by id";
        $args = array("id" => $_REQUEST["id"]);
    } else {
        trigger_error("Invalid operation", E_USER_ERROR);
    }

} else {
    $sql = "select * from (select times_table, number_correct, time_taken from results where times_table=1 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=2 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=3 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=4 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=5 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=6 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=7 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=8 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=9 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=10 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=11 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
union all
select * from (select times_table, number_correct, time_taken from results where times_table=12 and student_id=:student_id order by number_correct desc, time_taken asc limit 5) a
order by times_table asc, number_correct desc, time_taken asc";
    $args = array("student_id" => $data["student_id"]);
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

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Content-Type: text/json");
echo(json_encode($result));

$db->close();

?>
