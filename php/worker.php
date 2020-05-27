<?php
require __DIR__ . '/../vendor/autoload.php';

use Pheanstalk\Pheanstalk;


$pheanstalk = Pheanstalk::create('127.0.0.1');

// we want jobs from 'deleteTube' only.
$pheanstalk->watch('deleteTube');

// this hangs until a Job is produced.
$job = $pheanstalk->reserve();
try {
    // open connection
    $mysql = Opencloud__Db_connect(HOST, USER, PASSWORD, DATABASE);
    //decode json task data
    $jobPayload =  json_decode($job->getData());
    // Delete bd row
    if (!Opencloud__Db_delete_file( $mysql, $jobPayload->userId, $jobPayload->removeFileId)) {
        //release task
        $pheanstalk->release($job);
    };
    // If it's going to take a long time, periodically
    // tell beanstalk we're alive to stop it rescheduling the job.
    $pheanstalk->touch($job);

    // eventually we're done, delete job.
    $pheanstalk->delete($job);
}
catch(\Exception $e) {
    // handle exception.
    // and let some other worker retry.
    $pheanstalk->release($job);
}
