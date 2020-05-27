/**
 * A little vanilla framework
 * @link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest#A_little_vanilla_framework
 */
"use strict";
/*\
|*|
|*|  :: XMLHttpRequest.prototype.sendAsBinary() Polyfill ::
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#sendAsBinary()
\*/

if (!XMLHttpRequest.prototype.sendAsBinary) {
  XMLHttpRequest.prototype.sendAsBinary = function (sData) {
    var nBytes = sData.length,
        ui8Data = new Uint8Array(nBytes);

    for (var nIdx = 0; nIdx < nBytes; nIdx++) {
      ui8Data[nIdx] = sData.charCodeAt(nIdx) & 0xff;
    }
    /* send as ArrayBufferView...: */


    this.send(ui8Data);
    /* ...or as ArrayBuffer (legacy)...: this.send(ui8Data.buffer); */
  };
}
/*\
|*|
|*|  :: AJAX Form Submit Framework ::
|*|
|*|  https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest/Using_XMLHttpRequest
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  https://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntax:
|*|
|*|   AJAXSubmit(HTMLFormElement);
\*/


var AJAXSubmit = function () {
  function ajaxSuccess() {
    // console.log("AJAXSubmit - Success!");
    console.log(this.responseText); // location.reload();

    runRefresh();
    /* you can get the serialized data through the "submittedData" custom property: */

    /* console.log(JSON.stringify(this.submittedData)); */
  }

  function submitData(oData) {
    /* the AJAX request... */
    var oAjaxReq = new XMLHttpRequest();
    oAjaxReq.submittedData = oData;
    oAjaxReq.onload = ajaxSuccess;

    if (oData.technique === 0) {
      /* method is GET */
      oAjaxReq.open("get", oData.receiver.replace(/(?:\?.*)?$/, oData.segments.length > 0 ? "?" + oData.segments.join("&") : ""), true);
      oAjaxReq.send(null);
    } else {
      /* method is POST */
      oAjaxReq.open("post", oData.receiver, true);

      if (oData.technique === 3) {
        /* enctype is multipart/form-data */
        var sBoundary = "---------------------------" + Date.now().toString(16);
        oAjaxReq.setRequestHeader("Content-Type", "multipart\/form-data; boundary=" + sBoundary);
        oAjaxReq.sendAsBinary("--" + sBoundary + "\r\n" + oData.segments.join("--" + sBoundary + "\r\n") + "--" + sBoundary + "--\r\n");
      } else {
        /* enctype is application/x-www-form-urlencoded or text/plain */
        oAjaxReq.setRequestHeader("Content-Type", oData.contentType);
        oAjaxReq.send(oData.segments.join(oData.technique === 2 ? "\r\n" : "&"));
      }
    }
  }

  function processStatus(oData) {
    if (oData.status > 0) {
      return;
    }
    /* the form is now totally serialized! do something before sending it to the server... */

    /* doSomething(oData); */


    console.log("AJAXSubmit - The form is now serialized. Submitting...");
    submitData(oData);
  }

  function pushSegment(oFREvt) {
    this.owner.segments[this.segmentIdx] += oFREvt.target.result + "\r\n";
    this.owner.status--;
    processStatus(this.owner);
  }

  function plainEscape(sText) {
    /* How should I treat a text/plain form encoding?
       What characters are not allowed? this is what I suppose...: */

    /* "4\3\7 - Einstein said E=mc2" ----> "4\\3\\7\ -\ Einstein\ said\ E\=mc2" */
    return sText.replace(/[\s\=\\]/g, "\\$&");
  }

  function SubmitRequest(oTarget) {
    var nFile,
        sFieldType,
        oField,
        oSegmReq,
        oFile,
        bIsPost = oTarget.method.toLowerCase() === "post";
    /* console.log("AJAXSubmit - Serializing form..."); */

    this.contentType = bIsPost && oTarget.enctype ? oTarget.enctype : "application\/x-www-form-urlencoded";
    this.technique = bIsPost ? this.contentType === "multipart\/form-data" ? 3 : this.contentType === "text\/plain" ? 2 : 1 : 0;
    this.receiver = oTarget.action;
    this.status = 0;
    this.segments = [];
    var fFilter = this.technique === 2 ? plainEscape : escape;

    for (var nItem = 0; nItem < oTarget.elements.length; nItem++) {
      oField = oTarget.elements[nItem];

      if (!oField.hasAttribute("name")) {
        continue;
      }

      sFieldType = oField.nodeName.toUpperCase() === "INPUT" ? oField.getAttribute("type").toUpperCase() : "TEXT";

      if (sFieldType === "FILE" && oField.files.length > 0) {
        if (this.technique === 3) {
          /* enctype is multipart/form-data */
          for (nFile = 0; nFile < oField.files.length; nFile++) {
            oFile = oField.files[nFile];
            oSegmReq = new FileReader();
            /* (custom properties:) */

            oSegmReq.segmentIdx = this.segments.length;
            oSegmReq.owner = this;
            /* (end of custom properties) */

            oSegmReq.onload = pushSegment;
            this.segments.push("Content-Disposition: form-data; name=\"" + oField.name + "\"; filename=\"" + oFile.name + "\"\r\nContent-Type: " + oFile.type + "\r\n\r\n");
            this.status++;
            oSegmReq.readAsBinaryString(oFile);
          }
        } else {
          /* enctype is application/x-www-form-urlencoded or text/plain or
             method is GET: files will not be sent! */
          for (nFile = 0; nFile < oField.files.length; this.segments.push(fFilter(oField.name) + "=" + fFilter(oField.files[nFile++].name)));
        }
      } else if (sFieldType !== "RADIO" && sFieldType !== "CHECKBOX" || oField.checked) {
        /* NOTE: this will submit _all_ submit buttons. Detecting the correct one is non-trivial. */

        /* field type is not FILE or is FILE but is empty */
        this.segments.push(this.technique === 3 ?
        /* enctype is multipart/form-data */
        "Content-Disposition: form-data; name=\"" + oField.name + "\"\r\n\r\n" + oField.value + "\r\n" :
        /* enctype is application/x-www-form-urlencoded or text/plain or method is GET */
        fFilter(oField.name) + "=" + fFilter(oField.value));
      }
    }

    processStatus(this);
  }

  return function (oFormElement) {
    if (!oFormElement.action) {
      return;
    }

    new SubmitRequest(oFormElement);
  };
}(); // @link http://youmightnotneedjquery.com/

/**
 * $(document).ready(function(){});
 */


function ready(fn) {
  if (document.readyState != 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}
/**
 * $.ajax({
 *   type: 'POST',
 *   url: '/my/url',
 *   data: data
 * });
 */


function post_ajax(url, data) {
  var request = new XMLHttpRequest();
  request.open('POST', url, true);

  request.onload = function () {
    if (this.status >= 200 && this.status < 400) {
      // Success!
      let downloaded_data = JSON.parse(this.response);
      return downloaded_data;
    } else {
      // We reached our target server, but it returned an error
      return false;
    }
  };

  request.send(data);
}
/**
 * Set cookie, get cookie functions
 * @link https://plainjs.com/javascript/utilities/set-cookie-get-cookie-and-delete-cookie-5/
 */


function getCookie(name) {
  var v = document.cookie.match('(^|;) ?' + encodeURIComponent(name) + '=([^;]*)(;|$)');
  return v ? decodeURIComponent(v[2]) : null;
}

function setCookie(name, value, days) {
  var d = new Date();
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days);
  document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + "; path=/; expires=" + d.toGMTString() + ";SameSite=Strict"
  /*+ ";secure" + ";HttpOnly"*/
  ;
}

function deleteCookie(name) {
  setCookie(encodeURIComponent(name), '', -1);
}
/**
 * Functions Run After Refresh
 */


function runRefresh() {
  startProgress();

  if (loggedin()) {
    refreshTable(undefined, getCookie('folder__id'), getCookie('parent__folder__id'));
  }

  unblockLogin(loggedin());
  endProgress();
}
/**
 * Informing that some proccess started
 * 
 * @returns void
 */


function startProgress() {
  document.body.style.cursor = 'progress';
  let loadingQuery = '.block_loading'; // grab reference to form

  const loadingElem = document.querySelector(loadingQuery); // if the loadingElem exists

  if (!loadingElem || null == loadingElem || undefined == loadingElem) {
    console.debug("Cannot find loadingElem: " + loadingQuery);
    return;
  }

  loadingElem.style.display = 'block';
}
/**
 * Informing that some proccess finished
 *
 * @returns void
 */


function endProgress() {
  document.body.style.cursor = 'default';
  let loadingQuery = '.block_loading'; // grab reference to form

  const loadingElem = document.querySelector(loadingQuery); // if the loadingElem exists

  if (!loadingElem || null == loadingElem || undefined == loadingElem) {
    console.debug("Cannot find loadingElem: " + loadingQuery);
    return;
  }

  loadingElem.style.display = 'none';
}
/**
 * Run scripts after table refresh
 * 
 * @returns {void} Execute scripts inside
 */


function runAfterJSReady() {
  startProgress();
  removeLinkConfirm();
  renameLinkPrompt();
  publicLinkConfirm();
  folderLink();
  endProgress();
}
/**
 * UPLOAD FORM HANDLER
 */


function handleUploadForm(formQuery = '.upload') {
  // grab reference to form
  const formUploadElem = document.querySelector(formQuery); // if the form exists

  if (!formUploadElem || null == formUploadElem || undefined == formUploadElem) {
    console.debug("Cannot find form: " + formQuery);
    return;
  } //  Set filename for file input


  document.querySelector('.custom-file-input').addEventListener('change', function (e) {
    var fileName = document.getElementById("customFile").files[0].name;
    var nextSibling = e.target.nextElementSibling;
    nextSibling.innerText = fileName;
  }); // form submit handler

  formUploadElem.addEventListener('submit', e => {
    // on form submission, prevent default
    e.preventDefault();
    startProgress(); // AJAX Form Submit Framework

    console.debug('AJAX Form sent');

    if (loggedin()) {
      AJAXSubmit(formUploadElem);
      document.querySelector('.custom-file-label').innerText = "Выберите файл";
    } else {
      console.warn('please, login to upload files');
    }
  });
}
/**
 * Fill folder and file table
 * 
 * @param {string} filesListQuery Path to Table
 * @param {string} folder_id Folder to show
 * @param {string} parent_folder_id Parent Folder of current one
 * 
 * @returns {void} Refresh Folder and File tables
 */


function refreshTable(filesListQuery = '.files tbody', folder_id = 1, parent_folder_id = 1) {
  if (!loggedin()) {
    console.warn('please, login to see your files');
    return;
  }

  var fileTableQuery = '.filesList tbody'; // grab reference to Folder table

  const tableFolderElem = document.querySelector(filesListQuery); // grab reference to File table

  const tableFileElem = document.querySelector(fileTableQuery); // if the Folder table exists

  if (null == tableFolderElem || undefined == tableFolderElem) {
    console.debug("Cannot find table: " + filesListQuery);
    return;
  } // if thi File table exists


  if (null == tableFileElem || undefined == tableFileElem) {
    console.debug("Cannot find table: " + fileTableQuery);
    return;
  } // clear the tables


  tableFolderElem.innerHTML = '';
  tableFileElem.innerHTML = ''; //
  // AJAX get list of Files
  //
  // 1. form request

  let formData = new FormData();
  formData.append("files_list", "true");
  formData.append("parent_folder__id", folder_id);
  let url = 'php/download.php'; // 2. send request

  var request = new XMLHttpRequest();
  request.open('POST', url, true);

  request.onload = function () {
    if (this.status >= 200 && this.status < 400) {
      // 3. Success!
      let files = JSON.parse(this.response); // if the files exists

      if (!files || null == files || undefined == files || 0 == files.length) {
        console.debug("Cannot send request: ");
        console.debug(formData);
        return;
      }

      if (files[0]['error_text'] && 0 < files[0]['error_text'].length) {
        console.debug("Error: " + files[0]['error_text']);
      }

      if (files[0]['status'] && false == files[0]['status']) {
        console.debug('Cannot show files');
        return;
      }

      files.forEach(element => {
        if (2 == element['type']) {
          // folder table
          // Create an empty <tr> element and add it to the 1st position of the table:
          let rowFolder = tableFolderElem.insertRow(0);
          rowFolder.className = 'table__tr'; // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:

          let cellFolder1 = rowFolder.insertCell(0); // Name

          let cellFolder2 = rowFolder.insertCell(1); // Actions
          // css class

          cellFolder1.className = 'table__td align-middle';
          cellFolder2.className = 'table__td align-middle'; // Add some text to the new cells:

          cellFolder1.innerHTML = '<a href="#folder' + element['id'] + '" class="link link_folder" data-folder__id="' + element['id'] + '" data-parent_folder_id="' + folder_id + '"><i class="fa fa-folder"></i> ' + element['real_name'] + '</a>'; // Button for link rename remove

          cellFolder2.innerHTML = '<a href="#folder' + element['id'] + '" class="btn btn-success link_folder mx-1" data-folder__id="' + element['id'] + '" data-parent_folder_id="' + folder_id + '" title="Open ' + element['real_name'] + '"><i class="fa fa-sign-in"></i></a>';
          cellFolder2.innerHTML += '<a href="#rename__file-' + element['id'] + '" class="btn btn-primary link_rename mx-1" data-file__id="' + element['id'] + '" data-file__name="' + element['real_name'] + '" title="Rename ' + element['real_name'] + '"><i class="fa fa-pencil"></i></a>';
          cellFolder2.innerHTML += '<a href="php/remove.php?remove_file__id=' + element['id'] + '" class="btn btn-danger link_remove mx-1" data-file_id="' + element['id'] + '" data-real_name="' + element['real_name'] + '" title="Remove ' + element['real_name'] + '"><i class="fa fa-trash"></i></a>';
        } else if (1 == element['type']) {
          // file
          // Create an empty <tr> element and add it to the 1st position of the File table :
          let rowFile = tableFileElem.insertRow(0);
          rowFile.className = 'table__tr'; // Insert new cells (<td> elements) at the 1st and 2nd position of the "new" <tr> element:

          let cellFile1 = rowFile.insertCell(0); // Name for file

          let cellFile2 = rowFile.insertCell(1); // Actions for file
          // css class

          cellFile1.className = 'table__td align-middle';
          cellFile2.className = 'table__td align-middle m-0'; // Add some text to the new cells:

          cellFile1.innerHTML = '\
                    <div class="row_inline">\
                        <a href="php/download.php?download_file__id=' + element['id'] + '" class="link link_download" title="Download ' + element['real_name'] + '"><i class="fa fa-file-text-o m-1"></i> ' + element['real_name'] + '</a>\
                    </div>'; // Schedule button html content

          let scheduleButton;
          scheduleButton = '<div class="btn-group dropleft"><button type="button" class="btn btn-danger mx-1  dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fa fa-clock-o"></i></button><div class="dropdown-menu m-0 p-0 mr-1 border-0"><div class="btn-group dropdown-item p-0" role="group"><button type="dropdown-item" class="btn btn-primary d-none d-lg-block" disabled >Через: </button>';
          scheduleButton += '<a href="php/remove.php?remove_file__id=' + element['id'] + '&timer=1" type="dropdown-item"  class="btn btn-primary link_remove" data-file_id="' + element['id'] + '" data-real_name="' + element['real_name'] + '" title="Отложенное удаление ' + element['real_name'] + '">1 s</a>';
          scheduleButton += '<a href="php/remove.php?remove_file__id=' + element['id'] + '&timer=30" type="dropdown-item"  class="btn btn-primary link_remove" data-file_id="' + element['id'] + '" data-real_name="' + element['real_name'] + '" title="Отложенное удаление ' + element['real_name'] + '">30 s</a>';
          scheduleButton += '<a href="php/remove.php?remove_file__id=' + element['id'] + '&timer=60" type="dropdown-item"  class="btn btn-primary link_remove" data-file_id="' + element['id'] + '" data-real_name="' + element['real_name'] + '" title="Отложенное удаление ' + element['real_name'] + '">1 min</a>'; // Close div elements

          scheduleButton += '</div></div></div>';
          cellFile2.innerHTML = scheduleButton; // Button for download link rename remove

          cellFile2.innerHTML += '<a href="php/download.php?download_file__id=' + element['id'] + '" class="btn btn-success mx-1" data-file__id="' + element['id'] + '" title="Download ' + element['real_name'] + '"><i class="fa fa-download"></i></a>';
          cellFile2.innerHTML += '<a href="#public_link__id=' + element['id'] + '" class="btn btn-info link_public mx-1" data-file__id="' + element['id'] + '" title="Get Public Link for ' + element['real_name'] + '"><i class="fa fa-link fa-flip-horizontal"></i></a>';
          cellFile2.innerHTML += '<a href="#rename__file-' + element['id'] + '" class="btn btn-primary link_rename mx-1" data-file__id="' + element['id'] + '" data-file__name="' + element['real_name'] + '" title="Rename ' + element['real_name'] + '"><i class="fa fa-pencil"></i></a>';
          cellFile2.innerHTML += '<a href="php/remove.php?remove_file__id=' + element['id'] + '" class="btn btn-danger link_remove mx-1" data-file_id="' + element['id'] + '" data-real_name="' + element['real_name'] + '" title="Remove ' + element['real_name'] + '"><i class="fa fa-trash"></i></a>';
        }
      });
    } else {
      // We reached our target server, but it returned an error
      // or zero files found
      let rowFolder = tableFolderElem.insertRow(0);
      rowFolder.className = 'table__tr';
      let cellFolder1 = rowFolder.insertCell(0); // Name

      cellFolder1.className = 'table__td'; // Add some text to the new cells:

      cellFolder1.innerText = 'Эта папка пуста.';
      cellFolder1.setAttribute("colspan", "2"); // return false;
    } // Button back for sub-folders


    let backElem = document.querySelector('.go_back');
    backElem.innerHTML = "";

    if (folder_id != 1) {
      backElem.innerHTML = '<a href="#folderBack' + parent_folder_id + '" class="link link_folder btn btn-info btn-sm" data-folder__id="' + parent_folder_id + '" title="Previous folder"><i class="fa fa-arrow-left" aria-hidden="true"></i> Назад</a>';
    } // run content-rely code


    runAfterJSReady();
  };

  if (loggedin()) {
    request.send(formData);
  } else {
    console.warn('please, login to see your files');
  }
}
/**
 * Add event to all Rename File links.
 * Sends AJAX for renaming file.
 * 
 * @param string renameLinksQuery
 * 
 * @return void
 */


function renameLinkPrompt(renameLinksQuery = '.link_rename') {
  // grab reference to rename links
  const renameLinkElems = document.querySelectorAll(renameLinksQuery); // if the rename links exists

  if (null === renameLinkElems || undefined === renameLinkElems || 0 >= renameLinkElems.length) {
    console.log("Cannot find rename links: " + renameLinksQuery);
    return;
  }

  renameLinkElems.forEach(renameLinkElem => {
    // rename Links handler
    renameLinkElem.addEventListener('click', function (e) {
      // if AJAX - stop redirect
      e.preventDefault();
      var newFileName = window.prompt("New name:", renameLinkElem.dataset.file__name);

      if (!newFileName || newFileName == renameLinkElem.dataset.file__name) {
        return false;
      }

      startProgress(); //
      // AJAX rename file
      //
      // 1. form request

      let formData = new FormData();
      formData.append("file__rename", 'true');
      formData.append("file__id", renameLinkElem.dataset.file__id);
      formData.append("file__name", newFileName);
      let url = 'php/update.php'; // 2. send request

      var request = new XMLHttpRequest();
      request.open('POST', url, true);

      request.onload = function () {
        if (this.status >= 200 && this.status < 400) {
          // 3. Success!
          runRefresh();
        } else {
          console.debug('We reached our target server, but it returned an error');
          return false;
        }
      };

      request.send(formData);
    });
  });
}
/**
 * New Folder Event
 */


function handleAddFolder(addFolderQuery = '#add_folder') {
  // grab reference to form
  const buttonElem = document.querySelector(addFolderQuery); // if the form exists

  if (!buttonElem || null == buttonElem || undefined == buttonElem) {
    console.debug("Cannot find button: " + addFolderQuery);
    return;
  }

  buttonElem.addEventListener('click', function (event) {
    let add_folder__name = document.getElementById('folder_name').value;
    startProgress();

    if (!add_folder__name || null == add_folder__name || undefined == add_folder__name || 0 == add_folder__name.length) {
      console.debug('Empty new name');
      endProgress();
      return;
    } //
    // AJAX add new folder
    //
    // 1. form request


    let formData = new FormData();
    formData.append("add_folder", "true");
    formData.append("add_folder__name", add_folder__name);
    formData.append("parent_folder__id", buttonElem.dataset.folder_id);
    let url = 'php/upload.php'; // 2. send request

    var request = new XMLHttpRequest();
    request.open('POST', url, true);

    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        // 3. Success!
        // console.debug(this.response);
        let answer = JSON.parse(this.response); // if the files exists

        if (!answer || null == answer || undefined == answer || 0 == answer.length) {
          console.debug("Cannot get answer from server with data:");
          console.debug(formData);
          return;
        }

        document.getElementById("folder_name").value = "";
        console.debug(answer);
        runRefresh();
      } else {
        console.debug('We reached our target server, but it returned an error');
        return false;
      }
    };

    request.send(formData);
  });
}
/**
 * Logged In?
 */


function loggedin() {
  let loggedinVar = getCookie('user__loggedin');

  if (loggedinVar && null != loggedinVar && undefined != loggedinVar && 1 == loggedinVar) {
    return true;
  }

  return false;
}
/**
 * Login Handler
 */


function loginHandler(formLoginQuery = '#login') {
  // grab reference to form
  const formLoginElem = document.querySelector(formLoginQuery); // if the form exists

  if (null == formLoginElem || undefined == formLoginElem) {
    console.debug("Cannot find Login form: " + formLoginQuery);
    return;
  } // form submit handler


  formLoginElem.addEventListener('submit', e => {
    // on form submission, prevent default
    e.preventDefault();
    startProgress(); // AJAX Form Submit Framework

    console.debug('Login Form sent via AJAX');
    console.debug('AJAXSubmit("formLoginElem"');
    console.debug(formLoginElem);
    AJAXSubmit(formLoginElem);
  });
}
/**
 * Set Folderid and ParentFolderid to cookie
 * @param folderId
 * @param parentFolderId
 */


function setFolderPathCookie(folderId = 1, parentFolderId = 1) {
  setCookie('folder__id', folderId, 1);
  setCookie('parent__folder__id', parentFolderId, 1);
}
/**
 * Set User Name
 *
 * @param userNameQuery
 */


function setUserName(userNameQuery = '.user_name') {
  if (!loggedin()) {
    console.warn('please, login to see your files');
    return;
  }

  const userNameElem = document.querySelector(userNameQuery); // if the form exists

  if (null == userNameElem || undefined == userNameElem) {
    console.debug("Cannot find user name elem: " + userNameQuery);
    return;
  } //get cookie


  let userNameVar = getCookie('user__name');

  if (!userNameVar || null == userNameVar || undefined == userNameVar) {
    console.debug("Cannot find user name Cookie.");
    return;
  } // Add User Name


  userNameElem.innerText = userNameVar;
}
/**
 * Make visible hide block
 *
 * @param isPrivate
 */


function unblockLogin(isPrivate) {
  /**
   * MAKE IT VISIBLE
   */
  let privateBlocksQuery = '.block_private';
  let publicInBlocksQuery = '.block_public'; // grab reference to form

  let privateElems = document.querySelectorAll(privateBlocksQuery);
  let publicElems = document.querySelectorAll(publicInBlocksQuery);

  if (isPrivate) {
    // user is logged in
    // show hidden blocks
    setUserName();

    if (privateElems || null != privateElems || undefined != privateElems) {
      privateElems.forEach(privateElem => {
        privateElem.classList.remove('block_private');
      });
    } // hide public blocks


    if (publicElems || null != publicElems || undefined != publicElems) {
      publicElems.forEach(publicElem => {
        publicElem.classList.remove('block_public');
        publicElem.classList.add('block_hidden');
      });
    }
  } else {// user is not logged in
  }
}
/**
 * Add event to all Remove File links.
 * Confirm removing.
 * 
 * @param string removeLinksQuery 
 */


function removeLinkConfirm(removeLinksQuery = '.link_remove') {
  // grab reference to remove links
  const removeLinkElems = document.querySelectorAll(removeLinksQuery); // if the remove links exists

  if (null === removeLinkElems || undefined === removeLinkElems || 0 >= removeLinkElems.length) {
    console.log("Cannot find remove links: " + removeLinksQuery);
    return;
  }

  removeLinkElems.forEach(removeLinkElem => {
    // remove Links handler
    removeLinkElem.addEventListener('click', function (e) {
      var confirmation = window.confirm("Do you really want to remove " + removeLinkElem.dataset.real_name + " ?");
      startProgress();

      if (!confirmation) {
        // stop removing file
        e.preventDefault();
        endProgress();
      }
    });
  });
}
/**
 * Add event to all Public File links.
 * Shows public link.
 * 
 * @param string publicLinksQuery 
 */


function publicLinkConfirm(publicLinksQuery = '.link_public') {
  // grab reference to remove links
  const publicLinkElems = document.querySelectorAll(publicLinksQuery); // if the remove links exists

  if (null === publicLinkElems || undefined === publicLinkElems || 0 >= publicLinkElems.length) {
    console.log("Cannot find public links: " + publicLinksQuery);
    return;
  }

  publicLinkElems.forEach(publicLinkElem => {
    // remove Links handler
    publicLinkElem.addEventListener('click', function (e) {
      e.preventDefault();
      startProgress(); //
      // AJAX rename file
      //
      // 1. form request

      let formData = new FormData();
      formData.append("get_public_link", 'true');
      formData.append("file__id", publicLinkElem.dataset.file__id);
      let url = 'php/download.php'; // 2. send request

      var request = new XMLHttpRequest();
      request.open('POST', url, true);

      request.onload = function () {
        if (this.status >= 200 && this.status < 400) {
          // 3. Success!
          var answer = JSON.parse(this.response); // if the publicLink exists

          if (!answer || null == answer || undefined == answer || 0 == answer.length) {
            console.debug("Cannot answer: ");
            console.debug(formData);
            return;
          }

          alert(window.location.protocol + '//' + window.location.hostname + window.location.pathname + 'php/download.php?public_link=' + answer['public_link']);
          runRefresh();
        } else {
          console.debug('We reached our target server, but it returned an error');
          return false;
        }

        endProgress();
      };

      request.send(formData);
    });
  });
}
/**
 * Add event to all Folder links.
 * Refresh table with a parent folder ID.
 * 
 * @param {string} folderLinksQuery
 * 
 * @returns {void} Call refreshTable
 */


function folderLink(folderLinksQuery = '.link_folder') {
  // grab reference to remove links
  const folderLinkElems = document.querySelectorAll(folderLinksQuery); // if the remove links exists
  //document.querySelectorAll('.link_folder');

  if (null === folderLinkElems || undefined === folderLinkElems || 0 >= folderLinkElems.length) {
    console.log("Cannot find folder links: " + folderLinksQuery);
    return;
  }

  folderLinkElems.forEach(folderLinkElem => {
    // remove Links handler
    folderLinkElem.addEventListener('click', function (e) {
      e.preventDefault();
      startProgress(); // refresh Table

      refreshTable('.files tbody', folderLinkElem.dataset.folder__id, folderLinkElem.dataset.parent_folder_id); // set folder position

      setFolderPathCookie(folderLinkElem.dataset.folder__id, folderLinkElem.dataset.parent_folder_id); // Add Parent Folder ID to Upload form

      let formQuery = '.upload'; // grab reference to form

      const formUploadElem = document.querySelector(formQuery); // if the form exists

      if (!formUploadElem || null == formUploadElem || undefined == formUploadElem) {
        console.debug("Cannot find form: " + formQuery);
        return;
      }

      formUploadElem['parent_folder__id'].value = folderLinkElem.dataset.folder__id; // Add Parent Folder ID to Add Folder button

      let addFolderQuery = '#add_folder'; // grab reference to form

      const buttonElem = document.querySelector(addFolderQuery); // if the form exists

      if (!buttonElem || null == buttonElem || undefined == buttonElem) {
        console.debug("Cannot find button: " + addFolderQuery);
        return;
      }

      buttonElem.dataset.folder_id = folderLinkElem.dataset.folder__id;
    });
  });
}

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
//# sourceMappingURL=script.js.map