import { sdk } from './sdk'
import { appendFile } from 'fs'
import assert from 'assert'
import { uiPort } from './interfaces'

export const main = sdk.setupMain(async ({ effects, started }) => {
  console.info('Starting Start9 Pages...')

  const { pages } = await sdk.store
    .getOwn(effects, sdk.StorePath.config)
    .const()
  const interfaces = await sdk.serviceInterface.getAllOwn(effects).const()
  const nginxPath = '/etc/nginx/http.d/default.conf'

  appendFile(nginxPath, `server_names_hash_bucket_size 128;`, (err) =>
    assert.ifError(err),
  )

  const filebrowserMountpoint = '/mnt/filebrowser'
  const nextcloudMountpoint = '/mnt/nextcloud'

  let mounts = sdk.Mounts.of().addVolume('main', null, '/root', false)
  if (pages.some((p) => p.source === 'filebrowser')) {
    mounts = mounts.addDependency<typeof FilebrowserManifest>(
      'filebrowser',
      'data',
      null,
      filebrowserMountpoint,
      true,
    )
  }
  if (pages.some((p) => p.source === 'nextcloud')) {
    mounts = mounts.addDependency<typeof NextcloudManifest>(
      'nextcloud',
      'data',
      null,
      nextcloudMountpoint,
      true,
    )
  }

  for (const i of interfaces) {
    const { source, path } = pages.find((p) => p.id === i.id)!

    i.addressInfo?.hostnames.forEach((h) => {
      const toWrite = `
        server {
            autoindex on;
            listen ${uiPort};
            listen [::]:${uiPort};
            server_name ${h};
            root "${source === 'filebrowser' ? filebrowserMountpoint : nextcloudMountpoint}/${path}";
          }
        `
      appendFile(nginxPath, toWrite, (err) => assert.ifError(err))
    })
  }

  return sdk.Daemons.of({
    effects,
    started,
    healthReceipts: [],
  }).addDaemon('hosting-instance', {
    image: { id: 'main' },
    command: ['nginx', '-g', 'daemon off;'],
    mounts,
    ready: {
      display: 'Websites Ready', // If null, the health check will NOT be displayed to the user. If provided, this string will be the name of the health check and displayed to the user.
      // The function below determines the health status of the daemon.
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, 80, {
          successMessage: 'The web interface is ready',
          errorMessage: 'The web interface is unreachable',
        }),
    },
    requires: [],
  })
})
