document.addEventListener("DOMContentLoaded", () => {

  document.title = chrome.i18n.getMessage('extName');

  const REFRESH_INTERVAL = 5000;
  let refreshTimer = 0;

  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      await chrome.runtime.sendMessage({action: "new-tasks"})
    }, REFRESH_INTERVAL);
  };

  const $errorLine = document.querySelector('error-line');
  const $footer = document.querySelector('popup-footer');
  const $stateMessage = document.querySelector('state-message');
  const $taskList = document.querySelector('task-list');

  $taskList.addEventListener('action', async (event) => {
    await chrome.runtime.sendMessage({
      action: event.detail.action,
      data: { id: event.detail.id }
    });
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const action = msg.action;
    const data = msg.data || {};
    // console.log(`[popup] Received message [${action}]`, data);

    switch (action) {
      case "lock-task":
        $taskList.task(data.id)?.lock();
        break;

      case "unlock-task":
        $taskList.task(data.id)?.unlock();
        break;

      case "missing-config":
        clearTimeout(refreshTimer);

        $stateMessage.missingConfig();
        $errorLine.hide();
        $footer.hide();

        $taskList.update([]);
        $footer.setSpeedDownload("")
        $footer.setSpeedUpload("")
        $footer.setUpdatedAt("")

        return;

      case "app-error":
      case "api-error":
        $errorLine.show(data.message);
        break;

      case "task-list":
        $stateMessage.hide();
        $errorLine.hide();

        $taskList.update(data.tasks, data.locked);

        $footer.setSpeedDownload($taskList.speedDownload)
        $footer.setSpeedUpload($taskList.speedUpload)
        $footer.setUpdatedAt(data.updatedAt)
        $footer.show();

        (data.total) || $stateMessage.noActiveTasks()

        scheduleRefresh();
        break;
    }
  });

  chrome.runtime.sendMessage({action: "latest-tasks"}).then(() => {
    // console.log('Latest tasks asked');
  })
})

