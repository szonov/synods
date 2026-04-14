export const mockTaskListResponse1 = {
  data: {
    offset: 0,
    tasks: [
      {
        additional: {
          transfer: {
            downloaded_pieces: 0,
            size_downloaded: 32100260833,
            size_uploaded: 0,
            speed_download: 0,
            speed_upload: 0,
          },
        },
        id: 'dbid_221',
        size: 32100260833,
        status: 'finished',
        title: 'Title of torrent file with id dbid_221',
        type: 'bt',
        username: 'zonov',
      },
      {
        additional: {
          transfer: {
            downloaded_pieces: 0,
            size_downloaded: 2100260833,
            size_uploaded: 0,
            speed_download: 2400000,
            speed_upload: 0,
          },
        },
        id: 'dbid_228',
        size: 2100260833,
        status: 'error',
        status_extra: {
          error_detail: 'Duplicate task',
        },
        title: 'Title of torrent file with id dbid_228',
        type: 'bt',
        username: 'zonov',
      },
      {
        additional: {
          transfer: {
            downloaded_pieces: 0,
            size_downloaded: 464668672,
            size_uploaded: 60000,
            speed_download: 1240000,
            speed_upload: 0,
          },
        },
        id: 'dbid_230',
        size: 6225840128,
        status: 'downloading',
        title: 'Title of torrent file with id dbid_230',
        type: 'bt',
        username: 'zonov',
      },
      {
        additional: {
          transfer: {
            downloaded_pieces: 0,
            size_downloaded: 464668672,
            size_uploaded: 60000,
            speed_download: 0,
            speed_upload: 0,
          },
        },
        id: 'dbid_231',
        size: 225840128,
        status: 'paused',
        title: 'Title of torrent file with id dbid_231',
        type: 'bt',
        username: 'zonov',
      },
      {
        additional: {
          transfer: {
            downloaded_pieces: 0,
            size_downloaded: 464668672,
            size_uploaded: 60000,
            speed_download: 0,
            speed_upload: 0,
          },
        },
        id: 'dbid_235',
        size: 6225840128,
        status: 'paused',
        title: 'Title of torrent file with id dbid_235',
        type: 'bt',
        username: 'zonov',
      },
      {
        additional: {
          transfer: {
            downloaded_pieces: 0,
            size_downloaded: 464668672,
            size_uploaded: 60000,
            speed_download: 0,
            speed_upload: 4677800,
          },
        },
        id: 'dbid_238',
        size: 6225840128,
        status: 'seeding',
        title: 'Title of torrent file with id dbid_238. It has very very long name. It has very very long name',
        type: 'bt',
        username: 'zonov',
      },
    ],
    total: 5,
  },
  success: true,
};

export const mockTaskListResponse2 = {
  data: {
    offset: 0,
    tasks: [
      {
        additional: {
          transfer: {
            downloaded_pieces: 0,
            size_downloaded: 2100260833,
            size_uploaded: 0,
            speed_download: 0,
            speed_upload: 0,
          },
        },
        id: 'dbid_228',
        size: 12100260833,
        status: 'finished',
        title: 'Updated title of torrent file with ID dbid_228',
        type: 'bt',
        username: 'zonov',
      },
      {
        additional: {
          transfer: {
            downloaded_pieces: 0,
            size_downloaded: 464668672,
            size_uploaded: 60000,
            speed_download: 0,
            speed_upload: 0,
          },
        },
        id: 'dbid_231',
        size: 6225840128,
        status: 'paused',
        title: 'Title of torrent file with id dbid_231',
        type: 'bt',
        username: 'zonov',
      },
    ],
    total: 2,
  },
  success: true,
};

