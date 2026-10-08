declare interface SynoTaskItem {
  id: string;
  size: number;
  status: string;
  title: string;
  additional?: {
    transfer?: {
      size_downloaded: number;
      size_uploaded: number;
      speed_download: number;
      speed_upload: number;
    };
  };
  status_extra?: {
    error_detail?: string;
  };
}

declare interface AppTaskItem {
  id: string;
  status: string;
  title: string;
  subtitle: string;
  locked: boolean;
  statusIcon: string;
  canPause: boolean;
  canResume: boolean;
  percent: number;
}

declare interface SynologyAccount {
  id: string;
  name: string;
  host: string;
  account: string;
  passwd: string;
}

export declare interface PopupPageComponent {
  $root: HTMLElement;
  $el: HTMLElement;

  init: () => void;
  destroy: () => void;
  openDsm: () => void;
  openSettings: () => void;
  runAction: (action: string, id: string) => void;
  switchAccount: () => void;
  __: (string) => string;

  tasks: AppTaskItem[];
  accounts: SynologyAccount[];
  activeAccountId: string;
  speedDownload: string;
  speedUpload: string;
  updatedAt: string;
  stateMessage: string;
  errorMessage: string;
}

export declare interface SettingsPageComponent {
  init: () => void;
  destroy: () => void;
  handleSave: () => void;
  handleDelete: () => void;
  selectAccount: (id: string) => void;
  addAccount: () => void;
  __: (string) => string;
  _message: (type: "error" | "success" | "", text: string, timeout: number = 4000) => void;

  loading: boolean;
  accounts: SynologyAccount[];
  selectedId: string;
  activeAccountId: string;
  name: string;

  host: string;
  account: string;
  passwd: string;

  messageText: string;
  messageType: string;
}
