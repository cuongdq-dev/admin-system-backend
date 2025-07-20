import {
  Book,
  Category,
  Notification,
  Permission,
  Post as PostEntity,
  Role,
  Site,
  User,
} from '@app/entities';
import { NotificationStatus } from '@app/entities/notification.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Site)
    private siteRepository: Repository<Site>,

    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,

    @InjectRepository(Book)
    private bookRepository: Repository<Book>,

    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getSetting(user: User, workspaces: string) {
    const types =
      workspaces === 'wp_books'
        ? ['BOOK']
        : workspaces === 'wp_news'
          ? ['POST']
          : ['BOOK', 'POST'];

    const [notifyNew, u, sites, posts, books, categories, roles, permissions] =
      await Promise.all([
        this.notificationRepository.count({
          where: { user_id: user.id, status: NotificationStatus.NEW },
        }),
        this.userRepository.findOne({
          where: { id: user.id },
          relations: [
            'avatar',
            'user_roles',
            'user_roles.role.role_permissions',
            'user_roles.role.role_permissions.permission',
            'user_roles.role.role_permissions.role',
          ],
        }),
        this.siteRepository
          .createQueryBuilder('site')
          .where('site.created_by = :createdBy', { createdBy: user.id })
          .andWhere('site.type IN(:...types)', { types: types })
          .select(['site.id AS id', 'site.name AS title'])
          .getRawMany(),
        this.postRepository
          .createQueryBuilder('post')
          .select(['post.id AS id', 'post.title AS title'])
          .getRawMany(),
        this.bookRepository
          .createQueryBuilder('book')
          .select(['book.id AS id', 'book.title AS title'])
          .getRawMany(),

        this.categoryRepository
          .createQueryBuilder('category')
          .leftJoinAndSelect('category.sites', 'site')
          .andWhere('category.status IN(:...types)', { types: types })
          .select([
            'category.id AS id',
            'category.name AS title',
            'category.status AS type',
          ])
          .getRawMany(),
        this.roleRepository
          .createQueryBuilder('roles')
          .leftJoinAndSelect('role_permissions', 'user_roles')
          .getMany(),

        this.permissionRepository.createQueryBuilder('permissions').getMany(),
      ]);

    const permissionsArr = Object.values(
      permissions.reduce(
        (acc, { subject, action, id }) => {
          if (!acc[subject]) {
            acc[subject] = { name: subject, permissions: [] };
          }
          acc[subject].permissions.push({ action, id });
          return acc;
        },
        {} as Record<
          string,
          { name: string; permissions: { action: string; id: string }[] }
        >,
      ),
    );

    return {
      lang: [
        { code: 'vn', name: 'Việt Nam' },
        { code: 'en', name: 'English' },
      ],
      user: u,
      notifyNew,
      dropdown: { sites, posts, books, categories },
      collectionPermission: permissionsArr,
      roles: roles,
    };
  }

  async setFirebaseToken(token: string, user: User) {
    return await this.userRepository.update(
      { id: user.id },
      { firebase_token: token },
    );
  }

  async searchMultiplePages(continuation?: string, keyword?: string) {
    const maxPages = 50;
    // let continuation: string | undefined = undefined;
    const allChannels: any[] = [];

    for (let page = 0; page < maxPages; page++) {
      try {
        const { channels, continuation: next } = await this.searchWithCurlRaw(
          continuation,
          keyword,
        );

        if (!channels?.length) {
          console.warn(`No channels found at page ${page + 1}`);
          break;
        }

        const filtered = channels
          .filter((c) => {
            const count = parseSubscriberCount(c.subscribersText);
            return count >= 1000 && count <= 100000;
          })
          .map((c) => ({
            ...c,
            subscribersNumber: parseSubscriberCount(c.subscribersText),
          }));

        allChannels.push(...filtered);

        if (!next) break;
        continuation = next;
      } catch (err) {
        console.error(`Error on page ${page + 1}:`, err.message || err);
        break;
      }
    }

    return { keyword: keyword, continuation: continuation, lists: allChannels };
  }

  async searchWithCurlRaw(continuation?: string, keyword?: string) {
    const myHeaders = new Headers();
    myHeaders.append('accept', '*/*');
    myHeaders.append('accept-language', 'en,vi;q=0.9,en-US;q=0.8,vi-VN;q=0.7');
    myHeaders.append(
      'authorization',
      'SAPISIDHASH 1752401045_67aeb4975504aedc0b6fdd5ef4436da77495a23b_u SAPISID1PHASH 1752401045_67aeb4975504aedc0b6fdd5ef4436da77495a23b_u SAPISID3PHASH 1752401045_67aeb4975504aedc0b6fdd5ef4436da77495a23b_u',
    );
    myHeaders.append('content-type', 'application/json');
    myHeaders.append('origin', 'https://www.youtube.com');
    myHeaders.append('priority', 'u=1, i');
    myHeaders.append(
      'referer',
      `https://www.youtube.com/results?search_query=${keyword}&sp=CAASAhAC`,
    );
    myHeaders.append(
      'sec-ch-ua',
      '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
    );
    myHeaders.append('sec-ch-ua-arch', '"arm"');
    myHeaders.append('sec-ch-ua-bitness', '"64"');
    myHeaders.append('sec-ch-ua-form-factors', '"Desktop"');
    myHeaders.append('sec-ch-ua-full-version', '"138.0.7204.93"');
    myHeaders.append(
      'sec-ch-ua-full-version-list',
      '"Not)A;Brand";v="8.0.0.0", "Chromium";v="138.0.7204.93", "Google Chrome";v="138.0.7204.93"',
    );
    myHeaders.append('sec-ch-ua-mobile', '?0');
    myHeaders.append('sec-ch-ua-model', '""');
    myHeaders.append('sec-ch-ua-platform', '"macOS"');
    myHeaders.append('sec-ch-ua-platform-version', '"15.4.1"');
    myHeaders.append('sec-ch-ua-wow64', '?0');
    myHeaders.append('sec-fetch-dest', 'empty');
    myHeaders.append('sec-fetch-mode', 'same-origin');
    myHeaders.append('sec-fetch-site', 'same-origin');
    myHeaders.append(
      'user-agent',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    );
    myHeaders.append(
      'x-browser-copyright',
      'Copyright 2025 Google LLC. All rights reserved.',
    );
    myHeaders.append('x-browser-validation', 'qvLgIVtG4U8GgiRPSI9IJ22mUlI=');
    myHeaders.append('x-browser-year', '2025');
    myHeaders.append(
      'x-client-data',
      'CJG2yQEIo7bJAQipncoBCPbjygEIlqHLAQilo8sBCIagzQEI/qXOAQij8s4BCJP2zgEIofvOAQjf+84BGODizgEY0PrOAQ==',
    );
    myHeaders.append('x-goog-authuser', '1');
    myHeaders.append(
      'x-goog-visitor-id',
      'CgtEOHZ3aWM4QVVuMCiKic7DBjIKCgJWThIEGgAgUg%3D%3D',
    );
    myHeaders.append('x-origin', 'https://www.youtube.com');
    myHeaders.append('x-youtube-bootstrap-logged-in', 'true');
    myHeaders.append('x-youtube-client-name', '1');
    myHeaders.append('x-youtube-client-version', '2.20250710.09.00');
    myHeaders.append(
      'Cookie',
      'VISITOR_INFO1_LIVE=D8vwic8AUn0; VISITOR_PRIVACY_METADATA=CgJWThIEGgAgUg%3D%3D; VISITOR_INFO1_LIVE=ksORzZ2T9NI; VISITOR_PRIVACY_METADATA=CgJWThIEGgAgDA%3D%3D; LOGIN_INFO=AFmmF2swRgIhAIVXTbGrqD9PsXfs9cJbAVtVyo4A_lZCEUNLx6i78xcJAiEA9r7oZL7l2zltZkOXgqy8IBn1VJwdSpbd6D31GMtPjoE:QUQ3MjNmeS1TMnpqeTlDWEJGa0lVTVhTSEtpU0Qza09lU0hfNG96QU9TYjZyQnFTMUFpRDNLVUttTHdHSDhYR3ZIaGdySnN3YXVNbTNCaU14cVFmRng1ZEM3NEZEQktBa0N6QmkwaTR6WUEweC1TajQyQXNHUXZXY0FabU1sVzA1RXJMeWZQQVp1bmg3N3Q1anQ3UjJnQXRYalhRWXhWZ2Zn; HSID=A76PapUzQmn0Xvgq3; SSID=AriPqg2NjROLWAPLK; APISID=8xbDxZGX-jKOuRz3/AdGDoY6Q7o3CKMILY; SAPISID=G7pxgOI8UzV7rNfP/AwH2oo2dfD71Uo9u0; __Secure-1PAPISID=G7pxgOI8UzV7rNfP/AwH2oo2dfD71Uo9u0; __Secure-3PAPISID=G7pxgOI8UzV7rNfP/AwH2oo2dfD71Uo9u0; PREF=f6=40080000&f7=4150&tz=Asia.Saigon&f5=20000&f4=4000000; SID=g.a000ywgtq8L4QBgKkGMCb-1UVXO05MpZmask57ZmY8N-f7Jh9y0zNG8nLZ7Ki24o36_2GhWRlQACgYKAQUSARUSFQHGX2Mizz6DdieZ5NLbgYE60liDjBoVAUF8yKp0JyU9EAxfTqea45RKAKdo0076; __Secure-1PSID=g.a000ywgtq8L4QBgKkGMCb-1UVXO05MpZmask57ZmY8N-f7Jh9y0zoRkUYE4jx_nXRNyS4RVrVgACgYKASASARUSFQHGX2MiLKyw3TyKXCa_iFQo1enjYRoVAUF8yKoRwNyiDcr20CS05XAA_1oa0076; __Secure-3PSID=g.a000ywgtq8L4QBgKkGMCb-1UVXO05MpZmask57ZmY8N-f7Jh9y0zIWHmOYZmxuzyZOrOUASxlgACgYKAbISARUSFQHGX2Miq2EsphQ4LApz9_rC2Wv64RoVAUF8yKqLPJX5LTSIWmYUB64Bu7Pv0076; YSC=AMfG09PVhuo; __Secure-ROLLOUT_TOKEN=CI6T2KnYt-qb2QEQsKPt8-fYiQMYupHOkse5jgM%3D; funnelData={"loupe":{"percent":30,"isPanelShown":false},"cursor":{"percent":52,"isPanelShown":false},"blurb":{"percent":4,"isPanelShown":false},"darkmood":{"percent":3,"isPanelShown":false}}; __Secure-1PSIDTS=sidts-CjEB5H03P40DPBTJgRtZlmRHPWOXJdWod6G8hnisRdeQPNG1a1fvOtFjsNOSNiB7na2-EAA; __Secure-3PSIDTS=sidts-CjEB5H03P40DPBTJgRtZlmRHPWOXJdWod6G8hnisRdeQPNG1a1fvOtFjsNOSNiB7na2-EAA; SIDCC=AKEyXzV2aRzwbuLrImmHjzGbYj1R9sS6P3MVylhavMpN2WTRgZdzKOG6Fbu7hlvTWRK9CEwkWQ; __Secure-1PSIDCC=AKEyXzX55_j1px92wDe1r4jjkNdaCNG9uHmGfUZ56GgSmvquYZRMwDCLDVfApr3S6sXCKxc0m_w; __Secure-3PSIDCC=AKEyXzWXRhFTU9BpOJMcS1QgrXGUslUXW_Q7C_gFM8IHawt8rgbPe2Lje4RjXFCWrivDJBTL6CY; ST-1k06sw0=session_logininfo=AFmmF2swRgIhAIVXTbGrqD9PsXfs9cJbAVtVyo4A_lZCEUNLx6i78xcJAiEA9r7oZL7l2zltZkOXgqy8IBn1VJwdSpbd6D31GMtPjoE%3AQUQ3MjNmeS1TMnpqeTlDWEJGa0lVTVhTSEtpU0Qza09lU0hfNG96QU9TYjZyQnFTMUFpRDNLVUttTHdHSDhYR3ZIaGdySnN3YXVNbTNCaU14cVFmRng1ZEM3NEZEQktBa0N6QmkwaTR6WUEweC1TajQyQXNHUXZXY0FabU1sVzA1RXJMeWZQQVp1bmg3N3Q1anQ3UjJnQXRYalhRWXhWZ2Zn',
    );

    const raw = JSON.stringify({
      context: {
        client: {
          hl: 'vi',
          gl: 'VN',
          remoteHost: '116.105.36.153',
          deviceMake: 'Apple',
          deviceModel: '',
          visitorData: 'CgtEOHZ3aWM4QVVuMCiKic7DBjIKCgJWThIEGgAgUg%3D%3D',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36,gzip(gfe)',
          clientName: 'WEB',
          clientVersion: '2.20250710.09.00',
          osName: 'Macintosh',
          osVersion: '10_15_7',
          originalUrl: `https://www.youtube.com/results?search_query=${keyword}&sp=CAASAhAC`,
          screenPixelDensity: 2,
          platform: 'DESKTOP',
          clientFormFactor: 'UNKNOWN_FORM_FACTOR',
          configInfo: {
            appInstallData:
              'CIqJzsMGEIKgzxwQvbauBRD1_v8SEN68zhwQ9NXOHBCe0LAFELnZzhwQi6_PHBDgzbEFEKS2zxwQxbvPHBCXtc8cEOmIzxwQzdGxBRCU_rAFEODg_xIQgo_PHBD0xM8cEIGzzhwQvYqwBRDM364FEMn3rwUQn6HPHBDxnLAFENuvrwUQppqwBRDa984cEJGM_xIQmZixBRDCvs8cEParsAUQu9nOHBCIh7AFEI2szxwQkLzPHBDQpM8cELCGzxwQk4bPHBD8ss4cEMOKgBMQ15zPHBDXwbEFEKv4zhwQt-r-EhCJ6K4FEIHNzhwQ5a7PHBCHrM4cEImwzhwQl7nPHBDqu88cEJmNsQUQs5DPHBCKgoATEOevzxwQ4tSuBRC9nM8cEPDizhwQtbDPHBDuoM8cEMvRsQUQuOTOHBDSts8cEImXgBMQiOOvBRD7tM8cEL2ZsAUQ9rrPHBDT4a8FEI3MsAUQy8DPHBD7wM8cKjRDQU1TSWhVWm9MMndETkhrQnZQdDhRdVA5QTd2LXdiVl9BQzF6QWJCRTR5QkJjSmlIUWM9',
            coldConfigData:
              'CIqJzsMGEO26rQUQvbauBRDi1K4FEL2KsAUQ8ZywBRCe0LAFEM_SsAUQ4_iwBRCkvrEFENfBsQUQktSxBRD8ss4cEIGzzhwQ9NXOHBDJ4s4cELCGzxwQ74nPHBCzkM8cEL2czxwQ15zPHBCfoc8cELmnzxwQmqzPHBCdrs8cEIuvzxwQtLHPHBD7tM8cEKS2zxwQl7nPHBDqu88cEMK-zxwQvcDPHBDLwM8cEPvAzxwQyMLPHBDaw88cEPTEzxwQt8bPHBoyQU9qRm94MXl0anU2X0h5MmZCOUdITmFOVGdlWGhiOWxnb3l0QXpKTkFhNE1oSV9qOFEiMkFPakZveDBXbFozMlJhcXJHVGJYUm5zbnZMV0VTWkFYZmFRMTlVbVYtS2U2dWhXS1Z3KnxDQU1TVncwanVOMjNBcVFabHgtb0tyVUV2Ulg5QTRPRm1oQ3hBT1VNLVE3dUFCU3JIZG9SU3RBV0ZTaVpzYmNmaGFRRmtad0Z1SUFDQklxckJwTXVvYWdFazQwRm5YdjJpQWJJV3I5RnVBdW04QWFRM3diWEEtZXZCZz09',
            coldHashData:
              'CIqJzsMGEhM0MzAzMzkwODU5OTU1MTgxNDUzGIqJzsMGMjJBT2pGb3gxeXRqdTZfSHkyZkI5R0hOYU5UZ2VYaGI5bGdveXRBekpOQWE0TWhJX2o4UToyQU9qRm94MFdsWjMyUmFxckdUYlhSbnNudkxXRVNaQVhmYVExOVVtVi1LZTZ1aFdLVndCfENBTVNWdzBqdU4yM0FxUVpseC1vS3JVRXZSWDlBNE9GbWhDeEFPVU0tUTd1QUJTckhkb1JTdEFXRlNpWnNiY2ZoYVFGa1p3RnVJQUNCSXFyQnBNdW9hZ0VrNDBGblh2MmlBYklXcjlGdUF1bThBYVEzd2JYQS1ldkJnPT0%3D',
            hotHashData:
              'CIqJzsMGEhQxMTAyOTI5NTkzNjc3MTE0MjkwOBiKic7DBiiU5PwSKKXQ_RIonpH-EijIyv4SKK_M_hIot-r-EijBg_8SKJGM_xIo0q7_Eij1_v8SKMeAgBMoioKAEyjDioATKPeQgBMoh5GAEyjLkYATKMGWgBMoiZeAEyi4l4ATKPaagBMyMkFPakZveDF5dGp1Nl9IeTJmQjlHSE5hTlRnZVhoYjlsZ295dEF6Sk5BYTRNaElfajhROjJBT2pGb3gwV2xaMzJSYXFyR1RiWFJuc252TFdFU1pBWGZhUTE5VW1WLUtlNnVoV0tWd0I0Q0FNU0lRMEtvdGY2RmE3QkJwTk44Z3E1QkJVWDNjX0NETWFuN1F2WXpRbWx3QVhXVnc9PQ%3D%3D',
          },
          screenDensityFloat: 2,
          userInterfaceTheme: 'USER_INTERFACE_THEME_LIGHT',
          timeZone: 'Asia/Saigon',
          browserName: 'Chrome',
          browserVersion: '138.0.0.0',
          acceptHeader:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          deviceExperimentId:
            'ChxOelV5TmpVd05URXpNVGN3TnpjMU5ESXpNUT09EIqJzsMGGIqJzsMG',
          rolloutToken: 'CI6T2KnYt-qb2QEQsKPt8-fYiQMYupHOkse5jgM%3D',
          screenWidthPoints: 908,
          screenHeightPoints: 1038,
          utcOffsetMinutes: 420,
          connectionType: 'CONN_CELLULAR_4G',
          memoryTotalKbytes: '8000000',
          mainAppWebInfo: {
            graftUrl: `https://www.youtube.com/results?search_query=${keyword}&sp=CAASAhAC`,
            pwaInstallabilityStatus:
              'PWA_INSTALLABILITY_STATUS_CAN_BE_INSTALLED',
            webDisplayMode: 'WEB_DISPLAY_MODE_BROWSER',
            isWebNativeShareAvailable: true,
          },
        },
        user: {
          lockedSafetyMode: false,
        },
        request: {
          useSsl: true,
          internalExperimentFlags: [],
          consistencyTokenJars: [],
        },
        clickTracking: {
          clickTrackingParams: 'CDsQt6kLGAEiEwjFkrnJyrmOAxUagGMGHXI8Mqo=',
        },
        adSignalsInfo: {
          params: [
            {
              key: 'dt',
              value: '1752401035630',
            },
            {
              key: 'flash',
              value: '0',
            },
            {
              key: 'frm',
              value: '0',
            },
            {
              key: 'u_tz',
              value: '420',
            },
            {
              key: 'u_his',
              value: '10',
            },
            {
              key: 'u_h',
              value: '1169',
            },
            {
              key: 'u_w',
              value: '1800',
            },
            {
              key: 'u_ah',
              value: '1125',
            },
            {
              key: 'u_aw',
              value: '1800',
            },
            {
              key: 'u_cd',
              value: '30',
            },
            {
              key: 'bc',
              value: '31',
            },
            {
              key: 'bih',
              value: '1038',
            },
            {
              key: 'biw',
              value: '908',
            },
            {
              key: 'brdim',
              value: '0,44,0,44,1800,44,1800,1125,908,1038',
            },
            {
              key: 'vis',
              value: '1',
            },
            {
              key: 'wgl',
              value: 'true',
            },
            {
              key: 'ca_type',
              value: 'image',
            },
          ],
          bid: 'ANyPxKpmdukIdFHDr8WRcJBBzbjP_YbPLBbc8s9jLyIuR4fqN80rQ_HvFGbTnoUzJXMbCk8uAoWH-B57aZdFo5a-WuKCNS5MGw',
        },
      },
      continuation:
        continuation ||
        'EoAGEhFjYXRob2xpYyBwb2RjYXN0cxrqBUNBQVNBaEFDU0JTQ0FSaFZRMnhaVGpOWFdFRkdVSEl3UmtSSVZXRk1lREZuTUZHQ0FSaFZRM2t5VkdsdFdGZFpURWQ2VlZsb2JFcHNiV0ZEWVZHQ0FSaFZRM3BZWVRreWNVUnlWMmhQU2pkQllsVnpVVmxhYzFHQ0FSaFZReTFqVW1vMFNXNTBhMDFsWTAxSFNEaDZaVWRwVmtHQ0FSaFZRMEozY1haNVdubGpNbUp3ZWtrdGEwOVphSGR5YTNlQ0FSaFZRMkZSUkhSRmJsQmljVTVwWDNSTE5FVk9UbWRtUkdlQ0FSaFZRemRVVkdSRmVsSmxXbTlPYm1jM1VWZEhWbmxsYWxHQ0FSaFZRMHhMYm5ZMGRuQnJhVGRqVEdacGVqRkRkR3BsWTNlQ0FSaFZRMkpwTTNwblUyOUhUVXg1WW1OaGIwOTFNbnBoZG5lQ0FSaFZRM0ZpVW1GVU4yMUdNbUZUVTI5UVZFeHZXRTlWYjNlQ0FSaFZRM2sxY0dnMWFXRjBaM00zYTBGVmJIaHFabTFTVUhlQ0FSaFZRekpGWVROMmJTMU9Uak42TXpsUVNsSlpkRzR3UW1lQ0FSaFZRM0EwVkVobmIyUTRkR2czUWpCWGJVSm1WV2RVUzFHQ0FSaFZRMDgzYnpWMVdUVkhZbmhMYTNCVVZIaE5ORFpuY25lQ0FSaFZRMDFsTTA5VWNtcDZaVEpWTlVSdlQyZHlWV2xsZWxHQ0FSaFZRM2xWUjFNek9HWlhSbTV6V2tVMWEzRnJVMGRwWjNlQ0FSaFZRMDlYVTFSWlNHdHJjazAxWWxwUGRtSjJlVEJVWVhlQ0FSaFZRekV3WjNrMkxXc3pXV0ZwVldjeGMzVlZkWFU0Um5lQ0FSaFZRMU5TWnpST2IxbEhiVWxLYjBFMmJYUm1TVzl6U25lQ0FSaFZRek5yYmxZd2JUaG1TVGRuWm14WFZXcHROemRUZUhleUFRWUtCQWdVRUFJJTNEGIHg6BgiC3NlYXJjaC1mZWVk',
    });

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };

    const res = await fetch(
      'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
      requestOptions as any,
    ).then((response) => response.json());
    return this.extractResult(res);
  }

  private extractResult(json: any) {
    const items =
      json.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents ??
      json.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction
        ?.continuationItems ??
      [];

    const contents = items[0].itemSectionRenderer.contents;

    const channels = contents.map((channel: any) => {
      const c = channel.channelRenderer;
      if (!c) return {};

      return {
        podcast: c.title?.simpleText || c.title?.runs?.[0]?.text || '',
        channelId: c.channelId,
        subscribersNumber: parseSubscriberCount(
          c?.videoCountText?.simpleText || '',
        ),
        subscribersText: c?.videoCountText?.simpleText || 0,
        descriptions:
          c.descriptionSnippet?.runs?.map((run: any) => run.text).join('') ||
          '',

        link: `https://www.youtube.com/channel/${c.channelId}`,
      };
    });

    const continuation =
      json.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems?.find(
        (i: any) => i.continuationItemRenderer,
      )?.continuationItemRenderer?.continuationEndpoint?.continuationCommand
        ?.token ||
      json.contents?.twoColumnSearchResultsRenderer?.primaryContents
        ?.sectionListRenderer?.contents?.[1]?.continuationItemRenderer
        ?.continuationEndpoint?.continuationCommand?.token ||
      null;

    return { channels, continuation };
  }
}
function parseSubscriberCount(text: string): number {
  if (!text) return 0;

  // Normalize: lowercase, xóa "người đăng ký", trim khoảng trắng
  const cleaned = text
    .toLowerCase()
    .replace(/người đăng ký/g, '')
    .replace(/[,]/g, '.') // đổi , thành . (dấu thập phân)
    .trim();

  // Kiểm tra có "n" hoặc "k" nghĩa là đơn vị nghìn
  if (/[\d.]+\s*[nk]/i.test(cleaned)) {
    const number = parseFloat(cleaned);
    return Math.round(number * 1000);
  }

  // Không có N/K → parse thẳng
  const plain = parseInt(cleaned);
  return isNaN(plain) ? 0 : plain;
}
