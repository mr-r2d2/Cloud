<?php
require_once  __DIR__ . '/../vendor/autoload.php';

use Pheanstalk\Pheanstalk;

// Queue a Job
function schedulingFileRemove($timer, $removeFileId, $userId) {
    $data = json_encode(['removeFileId' => $removeFileId, 'userId' => $userId]);
    $pheanstalk = Pheanstalk::create('127.0.0.1');
    $pheanstalk
        ->useTube('deleteTube')
        ->put($data,// encode data in payload
            Pheanstalk::DEFAULT_PRIORITY, // default priority
            $timer, // delay by 30
            0  // beanstalk will retry job after 60s
        );
}
