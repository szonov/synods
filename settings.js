import { applyI18n, getMessage as __ } from "./lib/i18n.js";
import Status from "./lib/status.js";
import * as STORAGE from "./lib/storage.js";
// import { TaskList, demoResponse, demoResponse2 } from "./tasklist/tasklist2.js";

//
// // map: {taskId_1: true, taskId_2: true...,taskId_N: true}
// let cached = {
//   "dsw400": true,
//   "dbid_228": true,
// }
//
// function renderTasks(tasks){
//   console.log('USE TASKS', cached);
// }
//
// console.log(cached)
//
// import {TaskItem, exampleTask, exampleTask2, fullData, transformSynoTask} from './tasklist/taskitem.js';
//
// const inTasks = fullData.data.tasks
//
// const tasks = inTasks.map(transformSynoTask)
// console.log(tasks)
// renderTasks(tasks)

// customElements.define('task-list', TaskList)
// customElements.define('task-item', TaskItem)

const $form = document.querySelector("form");
const $host = document.getElementById("host");
const $username = document.getElementById("username");
const $password = document.getElementById("password");
const $saveBtn = document.getElementById("saveBtn");
const $clearBtn = document.getElementById("clearBtn");
//
// const $taskList = document.getElementById("task-list");
//
// const taskList = new TaskList(document.getElementById("task-list"));
//
// taskList.onEvent((event, id) => {
//   console.log(`taskList.onEvent: ${event} / ${id}`);
//
//   if (event === "pause" && id === "dbid_230") {
//     taskList.render(demoResponse2.data.tasks);
//   }
// });
//
// taskList.render(demoResponse.data.tasks);

// $taskList.addEventListener('pause', (e) => {
//   console.log(e);
// })
//
// $taskList.update([
//   {id:"task-100", title: "Download for task 100", progress: 10},
//   {id: "task-200", title: "Download for task 200", progress: 10}
// ])

// const t = document.createElement('task-item')
// t.update(exampleTask, 500)
// $taskList.appendChild(t);
// //
// // t.update({
// //   id: 'dbid_400',
// //   title: 'Direct task',
// //   status: 'success',
// //   size: '5000000'
// // },444)
// // t.dataset.id = 'dbid_400'
// // t.taskTitle = 'DFCZ'
// // t.taskOrder = 444
//
// const t2 = document.createElement('task-item')
// // t2.
// // t2.update(exampleTask2, 3)
// $taskList.appendChild(t2);
//
// setTimeout(() => {
//   t2.update(exampleTask2, 0)
//   // $taskList.update([
//   //   {id:"task-100", "title": "Download for task 100", progress: 30},
//   //   {id: "task-200", "title": "Download for task 200", progress: 10},
//   //   {id: "task-200", "title": "Download for task 200",  progress: 0}
//   // ])
//   // const task = $taskList.querySelector('[data-id="dbid_200"]')
//   // console.log($taskList,task);
//   // const synoTask = {
//   //   'id': 'dbid_228',
//   //   'size': 2100260833,
//   //   'status': 'finished',
//   //   'title': 'Man.Vs.Baby.S01.2025.WEB-DLRip-AVC.x264.seleZen',
//   //   'type': 'bt',
//   //   'username': 'zonov',
//   // };
//   // task.update(synoTask, 500)
//
// }, 4000)

const status = new Status(document.getElementById("status"));

applyI18n();

$form.addEventListener("submit", saveSettings);
$clearBtn.addEventListener("click", clearSettings);

await loadSettings();

async function loadSettings() {
  const settings = await STORAGE.get();

  $host.value = settings.host;
  $username.value = settings.account;
  $password.value = settings.passwd;
}

async function saveSettings(e) {
  e.preventDefault();

  const settings = {
    host: $host.value.trim(),
    account: $username.value.trim(),
    passwd: $password.value,
    sid: "", // important clear sid here
  };

  if (!validateInput(settings)) {
    return;
  }

  await STORAGE.set(settings);

  status.neutral(__("settingsSaved"), 10000);

  disableForm(true);
  const response = await chrome.runtime.sendMessage({ action: "login" });
  disableForm(false);

  if (response.success) {
    status.success(response.message);
  } else {
    status.error(response.message);
  }
}

async function clearSettings(e) {
  e.preventDefault();

  if (!confirm(__("clearSettingsConfirm"))) {
    return;
  }

  await STORAGE.clear();
  await loadSettings();

  status.success(__("clearSettingsSuccess"));
}

function validateInput({ host, account, passwd }) {
  if (host === "" || account === "" || passwd === "") {
    status.error(__("requiredAll"));
    return false;
  }

  if (!host.startsWith("http://") && !host.startsWith("https://")) {
    status.error(__("invalidHost"));
    return false;
  }

  return true;
}

function disableForm(disabled = true) {
  $host.disabled = disabled;
  $username.disabled = disabled;
  $password.disabled = disabled;
  $saveBtn.disabled = disabled;
  $clearBtn.className = disabled ? "d-none" : "";
}
