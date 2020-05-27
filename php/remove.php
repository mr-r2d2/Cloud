<?php
require __DIR__ . '/../vendor/autoload.php';

if (
    $_GET
    && isset($_GET['remove_file__id'])
    && $_COOKIE
    && isset($_COOKIE[COOKIE__USER_LOGGED_IN])
    && !empty($_COOKIE[COOKIE__USER_LOGGED_IN])
    && 1 == $_COOKIE[COOKIE__USER_LOGGED_IN]
    && isset($_COOKIE[COOKIE__USER_NAME])
    && !empty($_COOKIE[COOKIE__USER_NAME])
    && isset($_COOKIE[COOKIE__USER_ID])
    && !empty($_COOKIE[COOKIE__USER_ID])
) {
    // open connection
    $mysql = Opencloud__Db_connect(HOST, USER, PASSWORD, DATABASE);
    /**
     * Security check
     */
    if (!Opencloud__Db_check_login($mysql)) {
        http_response_code(401);
        print 'You cannot remove file.';
        return false;
    }

    $remove_file__id = filter_input(INPUT_GET, 'remove_file__id', FILTER_SANITIZE_NUMBER_INT);
    if (0 >= $remove_file__id) {
        // Redirect to the index page:
        http_response_code(400);
        header('Location: ' . htmlspecialchars(WEBSITE_ADDRESS));
        exit();
    }
    $user__id = filter_input(INPUT_COOKIE, COOKIE__USER_ID, FILTER_SANITIZE_NUMBER_INT);
    /**
     *  Scheduling remove 
     *  create new task to remove
     */
    if (isset($_GET['timer'])) {
        $timer_remove = filter_input(INPUT_GET, 'timer', FILTER_SANITIZE_NUMBER_INT);
        schedulingFileRemove($timer_remove, $remove_file__id, $user__id);
        http_response_code(203);
        header('Location: ' . htmlspecialchars(WEBSITE_ADDRESS));
        exit();
    }


    $file_path = Opencloud__Db_get_filePathById($mysql, $user__id, $remove_file__id);
    if ($file_path) { // file info is deleted
        /**
         * Check file exist
         *
         */
        $type = Opencloud__Db_get_file_type($mysql, $remove_file__id);
        Opencloud__Db_delete_file($mysql, $user__id, $remove_file__id);
        // delete file from storage
        if (realpath($file_path) && $type == 'file') {
            Opencloud__remove($file_path);
        }

        // TODO: check if it's the last file in DB then delete
    }

    Opencloud__Db_close($mysql);
    // Redirect to the index page:
    http_response_code(200);
    header('Location: ' . htmlspecialchars(WEBSITE_ADDRESS));
    exit();
}