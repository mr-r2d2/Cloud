ready(function () {
    startProgress();
    loginHandler();
    setFolderPathCookie();
    refreshTable();
    handleUploadForm();
    handleAddFolder();
    unblockLogin(loggedin());
    setUserName();
    endProgress();
});