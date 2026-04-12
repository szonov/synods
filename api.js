// api.js - Synology API wrapper

class SynologyAPI {
  constructor(host, username, password) {
    this.host = host;
    this.username = username;
    this.password = password;
    this.sessionId = null;
  }

  async login() {
    // TODO: Implement login to Synology API
    // POST /webapi/auth.cgi?api=SYNO.API.Auth&version=6&method=login
  }

  async getTasks() {
    // TODO: Get list of download tasks
    // GET /webapi/DownloadStation/task.cgi?api=SYNO.DownloadStation.Task&version=1&method=list
  }

  async addTask(url) {
    // TODO: Add download task by URL
  }

  async pauseTask(id) {
    // TODO: Pause download task
  }

  async resumeTask(id) {
    // TODO: Resume download task
  }

  async deleteTask(id) {
    // TODO: Delete download task
  }

  async clearAllTasks() {
    // TODO: Delete all completed tasks
  }
}