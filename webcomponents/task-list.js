(function () {

  class TaskList extends HTMLElement {
    constructor() {
      super();

      this.speedDownload = 0;
      this.speedUpload = 0;

      this.attachShadow({mode: 'open'});
      this.shadowRoot.innerHTML = `
        <style>
        .container {
            display: flex;
            flex-direction: column;
        }
        </style>
        <div class="container"></div>
      `;
    }

    _getAllTaskIds() {
      let taskIds = {};
      this.shadowRoot.querySelectorAll("task-item").forEach(($task) => {
        taskIds[$task.dataset.id] = true;
      });
      return taskIds;
    }

    update(synoTaskList, lockedIds = {}) {
      let markedForDeletion = this._getAllTaskIds(),
        speedDownload = 0,
        speedUpload = 0,
        order = 1;

      const $root = this.shadowRoot.querySelector('.container');

      synoTaskList.forEach((synoTask) => {

        const $task = this.task(synoTask.id) ?? this._createTaskItem(synoTask.id);
        $task.update(synoTask, lockedIds[synoTask.id]);

        $task.style.order = String(order++);

        if (!$task.isConnected) {
          $root.appendChild($task);
        }

        // totals
        speedDownload += $task.speedDownload;
        speedUpload += $task.speedUpload;

        delete markedForDeletion[synoTask.id];
      });

      // remove tasks which not come from api
      Object.keys(markedForDeletion).forEach((taskId) => {
        this.task(taskId)?.remove();
      });

      this.speedDownload = speedDownload;
      this.speedUpload = speedUpload;
    }

    _createTaskItem(taskId) {

      // create new HTMLDivElement
      const $task = document.createElement("task-item");
      $task.dataset.id = taskId;

      $task.addEventListener("action", (e) => {
        this.dispatchEvent(new CustomEvent('action', {detail: {id: taskId, action: e.detail}}));
      });

      return $task;
    }

    task(taskId) {
      return this.shadowRoot.querySelector(`task-item[data-id="${taskId}"]`);
    }
  }

  customElements.define('task-list', TaskList);
})();
