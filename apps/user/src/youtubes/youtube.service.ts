import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { parseStringPromise } from 'xml2js';

interface ColumnConfig {
  index: number;
  name: string;
  width: number;
  alignment?: 'LEFT' | 'CENTER' | 'RIGHT';
  wrapText?: boolean;
}

interface FormattingOptions {
  columnConfigs?: ColumnConfig[];
  keywordColor?: { red: number; green: number; blue: number };
  headerColor?: { red: number; green: number; blue: number };
  alternateRowColors?: boolean;
  rowHeight?: {
    keyword?: number;
    summary?: number;
    header?: number;
    data?: number;
  };
}

@Injectable()
export class YoutubesService {
  private readonly logger = new Logger(YoutubesService.name);
  private readonly sheets;
  private readonly spreadSheetId = process.env.GOOGLE_SPREADSHEET_ID;
  private readonly range = `Channels`;
  private sheetCache = new Map<string, number>();
  private sheetName: string;

  // Default column configurations cho YouTube channels
  private defaultColumnConfigs: ColumnConfig[] = [
    { index: 0, name: '#', width: 50, alignment: 'CENTER' },
    { index: 1, name: 'Podcast Name', width: 150, alignment: 'LEFT' },
    { index: 2, name: 'Link', width: 200, alignment: 'LEFT' },
    { index: 3, name: 'First Name', width: 50, alignment: 'LEFT' },
    { index: 4, name: 'Contact 1', width: 50, alignment: 'LEFT' },
    { index: 5, name: 'Contact 2', width: 50, alignment: 'LEFT' },
    { index: 6, name: 'Description', width: 200, alignment: 'LEFT' },
    { index: 7, name: 'Subscribers', width: 150, alignment: 'LEFT' },
    { index: 8, name: 'Country', width: 100, alignment: 'LEFT' },
    { index: 9, name: 'Total Video', width: 100, alignment: 'LEFT' },
    {
      index: 10,
      name: 'Social Links',
      width: 200,
      alignment: 'LEFT',
      wrapText: true,
    },
    {
      index: 11,
      name: 'Video Publish Time',
      width: 300,
      alignment: 'LEFT',
      wrapText: true,
    },
    { index: 12, name: 'Joined Date', width: 120, alignment: 'CENTER' },
  ];

  constructor() {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      throw new Error(
        'Missing GOOGLE_SERVICE_ACCOUNT_JSON in environment variables',
      );
    }

    const credentials = JSON.parse(serviceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
    this.sheetName = process.env.GOOGLE_SHEET_NAME || 'Channels';
  }

  async searchMultiplePages(keyword?: string) {
    const maxPages = 30;
    let continuation: string | undefined = undefined;
    const allChannels: any[] = [];

    // Lấy dữ liệu đã tồn tại
    const dataExist = (await this.googleSheet()).map((d: string) =>
      d.toLocaleLowerCase().trim(),
    ) as string[];

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
          ?.filter((c) => {
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

    const existSet = new Set(dataExist.map((d) => d.toLowerCase().trim()));

    const lists = allChannels
      .filter((c) => {
        const podcast = c?.podcast?.toLowerCase().trim();
        return podcast && !existSet.has(podcast);
      })
      .sort((a, b) => a.channelName?.localeCompare(b.channelName || '') || 0);

    // Lọc trùng trong nội bộ danh sách mới
    const uniqueLists = Array.from(
      new Map(
        lists.map((item) => [item.link?.toLowerCase().trim(), item]), // bạn có thể đổi key
      ).values(),
    );

    // Enrich
    const enrichedLists = [];

    for (const item of uniqueLists) {
      try {
        const extra = await this.fetchExtraInfo(item.channelName);

        // FETCH VIDEO INFO
        let videoId, published, videoUrl, videoTitle, videoDescription;

        try {
          const channelId = item.channelId || item.link?.split('/').pop();
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          const res = await fetch(rssUrl);
          const xml = await res.text();
          const parsed = await parseStringPromise(xml, {
            explicitArray: false,
          });

          const feed = parsed.feed;
          const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

          // ❗ Chỉ lấy video thường, không lấy Shorts
          const normalVideo = entries.find((entry) =>
            entry.link?.['$']?.href?.includes('/watch?v='),
          );

          if (normalVideo) {
            videoId = normalVideo['yt:videoId'];
            published = normalVideo.published;
            videoUrl = normalVideo.link?.['$']?.href;
            videoTitle = normalVideo['media:group']?.['media:title'];
            videoDescription =
              normalVideo['media:group']?.['media:description'];
          }
        } catch (e) {
          console.warn(`XML fetch failed for ${item.link}:`, e.message || e);
        }

        enrichedLists.push({
          ...item,
          ...extra,
          latestVideoId: videoId,
          latestPublished: published,
          latestVideoUrl: videoUrl,
          latestVideoTitle: videoTitle,
          latestVideoDescription: videoDescription,
        });
      } catch (e) {
        console.warn(
          `Failed to fetch details for ${item.link}:`,
          e.message || e,
        );
        enrichedLists.push(item);
      }
    }

    // Sử dụng formatting đẹp mới
    await this.appendStyledKeyword(keyword, enrichedLists);
    return { enrichedLists, keyword: keyword };
  }

  async searchMultiplePagesWithNewSheet(keyword?: string) {
    const maxPages = 30;
    let continuation: string | undefined = undefined;
    const allChannels: any[] = [];

    // Lấy dữ liệu đã tồn tại
    const dataExist = (await this.googleSheet()).map((d: string) =>
      d.toLocaleLowerCase().trim(),
    ) as string[];

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
          ?.filter((c) => {
            const count = parseSubscriberCount(c.subscribersText);
            return count >= 100000 && count <= 200000;
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

    const existSet = new Set(dataExist.map((d) => d.toLowerCase().trim()));

    const lists = allChannels
      .filter((c) => {
        const podcast = c?.podcast?.toLowerCase().trim();
        return podcast && !existSet.has(podcast);
      })
      .sort((a, b) => a.channelName?.localeCompare(b.channelName || '') || 0);

    // Lọc trùng trong nội bộ danh sách mới
    const uniqueLists = Array.from(
      new Map(
        lists.map((item) => [item.link?.toLowerCase().trim(), item]), // bạn có thể đổi key
      ).values(),
    );

    // Enrich
    const enrichedLists = [];

    for (const item of uniqueLists) {
      try {
        const extra = await this.fetchExtraInfo(item.channelName);

        // FETCH VIDEO INFO
        let videoId, published, videoUrl, videoTitle, videoDescription;

        try {
          const channelId = item.channelId || item.link?.split('/').pop();
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          const res = await fetch(rssUrl);
          const xml = await res.text();
          const parsed = await parseStringPromise(xml, {
            explicitArray: false,
          });

          const feed = parsed.feed;
          const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

          // ❗ Chỉ lấy video thường, không lấy Shorts
          const normalVideo = entries.find((entry) =>
            entry.link?.['$']?.href?.includes('/watch?v='),
          );

          if (normalVideo) {
            videoId = normalVideo['yt:videoId'];
            published = normalVideo.published;
            videoUrl = normalVideo.link?.['$']?.href;
            videoTitle = normalVideo['media:group']?.['media:title'];
            videoDescription =
              normalVideo['media:group']?.['media:description'];
          }
        } catch (e) {
          console.warn(`XML fetch failed for ${item.link}:`, e.message || e);
        }

        enrichedLists.push({
          ...item,
          ...extra,
          latestVideoId: videoId,
          latestPublished: published,
          latestVideoUrl: videoUrl,
          latestVideoTitle: videoTitle,
          latestVideoDescription: videoDescription,
        });
      } catch (e) {
        console.warn(
          `Failed to fetch details for ${item.link}:`,
          e.message || e,
        );
        enrichedLists.push(item);
      }
    }

    // Sử dụng formatting đẹp mới
    await this.appendStyledKeyword(keyword, enrichedLists, keyword);
    return { enrichedLists, keyword: keyword };
  }

  async fetchExtraInfo(channelName) {
    const url = `https://www.youtube.com${channelName}`;

    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    })
      .then((response) => response.text())
      .then((result) => {
        return result;
      })
      .catch((error) => {
        return undefined;
      });

    const jsonData = await extractYtInitialData(res);
    const continuationCommand = this.findContinuationCommand(jsonData?.header);
    const descriptionsRes = await fetch(
      'https://www.youtube.com/youtubei/v1/browse?prettyPrint=false',
      {
        method: 'POST',
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB',
              clientVersion: '2.20250717.02.00',
            },
          },
          continuation: continuationCommand?.token,
        }),
        redirect: 'follow',
      },
    )
      .then((response) => response.json())
      .then((result) => {
        return result;
      })
      .catch((error) => {
        return undefined;
      });

    const aboutChannelViewModel =
      descriptionsRes?.onResponseReceivedEndpoints?.[0]
        .appendContinuationItemsAction?.continuationItems?.[0]
        ?.aboutChannelRenderer?.metadata?.aboutChannelViewModel;

    return {
      description: aboutChannelViewModel.description,
      country: aboutChannelViewModel?.country,
      joinedDateText: aboutChannelViewModel?.joinedDateText?.content,
      totalVideo: aboutChannelViewModel?.videoCountText,
      links: aboutChannelViewModel?.links?.map(
        (link) =>
          `https://${link?.channelExternalLinkViewModel?.link?.content}`,
      ),
    };
  }

  findContinuationCommand(obj: any): any | null {
    if (typeof obj !== 'object' || obj === null) return null;

    if ('continuationCommand' in obj) return obj.continuationCommand;

    for (const key in obj) {
      const result = this.findContinuationCommand(obj[key]);
      if (result) return result;
    }

    return null;
  }

  async searchWithCurlRaw(continuation?: string, keyword?: string) {
    if (!continuation) {
      const res = await fetch(
        `https://www.youtube.com/results?search_query=${keyword}&sp=CAASAhAC`,
        { method: 'GET' },
      )
        .then((response) => response.text())
        .then((result) => {
          return result;
        })
        .catch((error) => {
          return undefined;
        });
      const jsonData = await extractYtInitialData(res);
      return this.extractResult(jsonData, continuation);
    } else {
      const res = await fetch(
        'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
        {
          method: 'POST',
          body: JSON.stringify({
            context: {
              client: { clientName: 'WEB', clientVersion: '2.20250710.09.00' },
            },
            continuation: continuation,
          }),
        },
      )
        .then((response) => response.json())
        .then((result) => {
          return result;
        })
        .catch((error) => {
          return undefined;
        });
      return this.extractResult(res, continuation);
    }
  }

  async googleSheet() {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'bachduong',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    const dataExist = rows.slice(1).map((row) =>
      headers.reduce((acc, header, i) => {
        return row[i];
      }, {}),
    );

    return dataExist;
  }

  private extractResult(json: any, continuation?: string) {
    const items = !continuation
      ? json?.contents?.twoColumnSearchResultsRenderer?.primaryContents
          ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents
      : json.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction
          ?.continuationItems?.[0]?.itemSectionRenderer?.contents;
    const channels = items.map((channel: any) => {
      const c = channel.channelRenderer;
      if (!c) return {};

      return {
        podcast: c.title?.simpleText || c.title?.runs?.[0]?.text || '',
        channelName: c?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl,
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

    const continuationCommand = this.findContinuationCommand(json);

    return { channels, continuation: continuationCommand?.token };
  }

  /**
   * Tự động lấy sheetId dựa vào tên sheet
   */
  private async getSheetIdByName(sheetName: string): Promise<number> {
    if (this.sheetCache.has(sheetName)) {
      return this.sheetCache.get(sheetName)!;
    }

    try {
      this.logger.log(`🔍 Getting sheet ID for sheet name: "${sheetName}"`);

      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadSheetId,
      });

      const sheet = spreadsheet.data.sheets?.find(
        (s) => s.properties?.title === sheetName,
      );

      if (!sheet || sheet.properties?.sheetId === undefined) {
        throw new Error(`Sheet with name "${sheetName}" not found`);
      }

      const sheetId = sheet.properties.sheetId;
      this.sheetCache.set(sheetName, sheetId);

      this.logger.log(
        `✅ Found sheet ID: ${sheetId} for sheet: "${sheetName}"`,
      );
      return sheetId;
    } catch (error) {
      this.logger.error(`❌ Error getting sheet ID for "${sheetName}":`, error);
      throw new Error(`Failed to get sheet ID: ${error.message}`);
    }
  }

  /**
   * Thêm dữ liệu với formatting đẹp
   */
  async appendStyledKeyword(
    keyword: string,
    data: any[],
    targetSheetName?: string,
    options?: FormattingOptions,
  ) {
    try {
      const sheetName = targetSheetName || this.sheetName;
      const sheetId = await this.createSheetIfNotExists(sheetName);

      // Merge default options với custom options
      const formattingOptions: FormattingOptions = {
        columnConfigs: this.defaultColumnConfigs,
        keywordColor: { red: 0.2, green: 0.4, blue: 0.8 },
        headerColor: { red: 0.2, green: 0.7, blue: 0.4 },
        alternateRowColors: true,
        rowHeight: {
          keyword: 45,
          summary: 30,
          header: 35,
          data: 28,
        },
        ...options,
      };

      // Lấy dữ liệu hiện tại
      const currentData = await this.getCurrentSheetData(sheetName);
      const lastRowWithData = this.findLastRowWithData(currentData);

      this.logger.log(`📊 Current last row with data: ${lastRowWithData}`);

      // Chuẩn bị dữ liệu
      const newData = this.prepareDataForAppend(keyword, data);
      const appendStartRow = lastRowWithData + 1;

      // Append dữ liệu
      await this.appendDataToSheet(newData, appendStartRow, sheetName);

      // Apply formatting đẹp
      await this.applyBeautifulFormatting(
        appendStartRow,
        newData,
        keyword,
        sheetId,
        formattingOptions,
      );

      this.logger.log(
        `✅ Successfully added ${data.length} rows for keyword: "${keyword}" to sheet: "${sheetName}"`,
      );

      return {
        success: true,
        message: `Added ${data.length} rows for keyword: "${keyword}"`,
        sheetName,
        sheetId,
        startRow: appendStartRow,
        endRow: appendStartRow + newData.values.length,
        keyword,
        dataCount: data.length,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error appending data for keyword "${keyword}":`,
        error,
      );
      throw new Error(`Failed to append data: ${error.message}`);
    }
  }

  private async getCurrentSheetData(sheetName: string) {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadSheetId,
      range: sheetName,
    });
    return response.data.values || [];
  }

  private findLastRowWithData(data: any[][]): number {
    if (!data || data.length === 0) return 0;

    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i];
      if (row && row.some((cell) => cell && cell.toString().trim() !== '')) {
        return i + 1;
      }
    }
    return 0;
  }

  private prepareDataForAppend(keyword: string, data: any[]) {
    // Dòng phân cách
    const separatorRow = Array(10).fill('');

    // Dòng keyword với style đẹp
    const keywordRow = [
      `🎯 YOUTUBE SEARCH: ${keyword?.toUpperCase() || 'UNKNOWN'}`,
      ...Array(9).fill(''),
    ];

    // Dòng thông tin tổng quan
    const summaryRow = [
      `📊 Found: ${data.length} channels | Filtered: 1K-100K subscribers | Date: ${new Date().toLocaleDateString('vi-VN')}`,
      ...Array(9).fill(''),
    ];

    // Header với icons
    const tableHeader = [
      '📋 #',
      '🎙️ Podcast',
      '🔗 Channel Link',
      'First Name',
      'Contact 1',
      'Contact 2',
      '📝 Description',
      '👥 Subscribers',
      'Country',
      'Total Video',
      'Social Links',
      '📅 Video Publish Time',
      '📅 Date Joined',
    ];

    // Dữ liệu channels
    const rows = data.map((item, index) => [
      `${index + 1}`.padStart(3, '0'),
      item.podcast || 'N/A',
      item.link || 'N/A',
      'N/A',
      'N/A',
      'N/A',
      item?.descriptions || 'N/A',
      item?.subscribersText || 'N/A',
      item?.country || 'N/A',
      item?.totalVideo || 'N/A',
      item?.links?.join('\n'),
      `${
        new Date(item?.latestPublished).toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour12: false,
        }) || 'N/A'
      }\n${item.latestVideoTitle}\n${item.latestVideoUrl}`,

      item?.joinedDateText,
    ]);
    return {
      values: [separatorRow, keywordRow, summaryRow, tableHeader, ...rows],
      separatorRowCount: 1,
      keywordRowCount: 1,
      summaryRowCount: 1,
      headerRowCount: 1,
      dataRowCount: rows.length,
    };
  }

  private async appendDataToSheet(
    newData: any,
    startRow: number,
    sheetName: string,
  ) {
    const targetRange = `${sheetName}!A${startRow}`;

    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadSheetId,
      range: targetRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: newData.values,
      },
    });
  }

  private async applyBeautifulFormatting(
    startRow: number,
    newData: any,
    keyword: string,
    sheetId: number,
    options: FormattingOptions,
  ) {
    const startRowIndex = startRow - 1;
    const separatorRowStart = startRowIndex;
    const separatorRowEnd = startRowIndex + 1;
    const keywordRowStart = startRowIndex + 1;
    const keywordRowEnd = startRowIndex + 2;
    const summaryRowStart = startRowIndex + 2;
    const summaryRowEnd = startRowIndex + 3;
    const headerRowStart = startRowIndex + 3;
    const headerRowEnd = startRowIndex + 4;
    const dataRowStart = startRowIndex + 4;
    const dataRowEnd = startRowIndex + newData.values.length;

    const requests = [];

    // 📏 1. Set độ rộng cột theo config
    if (options.columnConfigs) {
      for (const columnConfig of options.columnConfigs) {
        requests.push({
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: 'COLUMNS',
              startIndex: columnConfig.index,
              endIndex: columnConfig.index + 1,
            },
            properties: {
              pixelSize: columnConfig.width,
            },
            fields: 'pixelSize',
          },
        });
      }
    }
    // 📏 2. Set độ cao dòng
    if (options.rowHeight) {
      // Keyword row
      if (options.rowHeight.keyword) {
        requests.push({
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: keywordRowStart,
              endIndex: keywordRowEnd,
            },
            properties: {
              pixelSize: options.rowHeight.keyword,
            },
            fields: 'pixelSize',
          },
        });
      }

      // Summary row
      if (options.rowHeight.summary) {
        requests.push({
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: summaryRowStart,
              endIndex: summaryRowEnd,
            },
            properties: {
              pixelSize: options.rowHeight.summary,
            },
            fields: 'pixelSize',
          },
        });
      }

      // Header row
      if (options.rowHeight.header) {
        requests.push({
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: headerRowStart,
              endIndex: headerRowEnd,
            },
            properties: {
              pixelSize: options.rowHeight.header,
            },
            fields: 'pixelSize',
          },
        });
      }

      // Data rows
      if (options.rowHeight.data) {
        requests.push({
          updateDimensionProperties: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: dataRowStart,
              endIndex: dataRowEnd,
            },
            properties: {
              pixelSize: options.rowHeight.data,
            },
            fields: 'pixelSize',
          },
        });
      }
    }

    // 🎨 3. Dòng phân cách
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: separatorRowStart,
          endRowIndex: separatorRowEnd,
          startColumnIndex: 0,
          endColumnIndex: 14,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 },
          },
        },
        fields: 'userEnteredFormat(backgroundColor)',
      },
    });

    // 🎯 4. Dòng keyword
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: keywordRowStart,
          endRowIndex: keywordRowEnd,
          startColumnIndex: 0,
          endColumnIndex: 14,
        },
        cell: {
          userEnteredFormat: {
            wrapStrategy: 'WRAP',
            backgroundColor: options.keywordColor,
            textFormat: {
              bold: true,
              fontSize: 12,
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            },
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields:
          'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
      },
    });

    // 📊 5. Dòng summary
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: summaryRowStart,
          endRowIndex: summaryRowEnd,
          startColumnIndex: 0,
          endColumnIndex: 14,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.85, green: 0.92, blue: 1.0 },
            textFormat: {
              bold: true,
              fontSize: 11,
              foregroundColor: { red: 0.2, green: 0.2, blue: 0.6 },
              italic: true,
            },
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields:
          'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
      },
    });

    // 📋 6. Header row
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: headerRowStart,
          endRowIndex: headerRowEnd,
          startColumnIndex: 0,
          endColumnIndex: 14,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: options.headerColor,
            textFormat: {
              bold: true,
              fontSize: 12,
              foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
            },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields:
          'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)',
      },
    });

    // 📝 7. Data rows với formatting theo config
    const dataRowCount = dataRowEnd - dataRowStart;
    for (let i = 0; i < dataRowCount; i++) {
      const isEvenRow = i % 2 === 0;
      const rowStart = dataRowStart + i;
      const rowEnd = rowStart + 1;

      // Base formatting
      const backgroundColor =
        options.alternateRowColors && isEvenRow
          ? { red: 0.98, green: 0.99, blue: 1.0 }
          : { red: 1.0, green: 1.0, blue: 1.0 };

      requests.push(
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowStart,
              endRowIndex: rowEnd,
              startColumnIndex: 0,
              endColumnIndex: 14,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor,
                textFormat: {
                  fontSize: 10,
                  foregroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                },
                verticalAlignment: 'MIDDLE',
                wrapStrategy: 'WRAP',
              },
            },
            fields:
              'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId,
              dimension: 'ROWS',
              startIndex: startRowIndex,
              endIndex: rowEnd,
            },
          },
        },
      );

      // Apply alignment cho từng cột
      if (options.columnConfigs) {
        for (const columnConfig of options.columnConfigs) {
          requests.push({
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: rowStart,
                endRowIndex: rowEnd,
                startColumnIndex: columnConfig.index,
                endColumnIndex: columnConfig.index + 1,
              },
              cell: {
                userEnteredFormat: {
                  horizontalAlignment: columnConfig.alignment || 'LEFT',
                  wrapStrategy: columnConfig.wrapText
                    ? 'WRAP'
                    : 'OVERFLOW_CELL',
                },
              },
              fields: 'userEnteredFormat(horizontalAlignment,wrapStrategy)',
            },
          });
        }
      }
    }

    // 🔲 8. Borders
    requests.push({
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: keywordRowStart,
          endRowIndex: dataRowEnd,
          startColumnIndex: 0,
          endColumnIndex: 14,
        },
        top: {
          style: 'SOLID',
          width: 1,
          color: { red: 0.2, green: 0.2, blue: 0.2 },
        },
        bottom: {
          style: 'SOLID',
          width: 1,
          color: { red: 0.2, green: 0.2, blue: 0.2 },
        },
        left: {
          style: 'SOLID',
          width: 1,
          color: { red: 0.2, green: 0.2, blue: 0.2 },
        },
        right: {
          style: 'SOLID',
          width: 1,
          color: { red: 0.2, green: 0.2, blue: 0.2 },
        },
        innerHorizontal: {
          style: 'SOLID',
          width: 1,
          color: { red: 0.8, green: 0.8, blue: 0.8 },
        },
        innerVertical: {
          style: 'SOLID',
          width: 1,
          color: { red: 0.8, green: 0.8, blue: 0.8 },
        },
      },
    });

    // 🔲 9. Special border cho header
    requests.push({
      updateBorders: {
        range: {
          sheetId,
          startRowIndex: headerRowStart,
          endRowIndex: headerRowEnd,
          startColumnIndex: 0,
          endColumnIndex: 14,
        },
        bottom: {
          style: 'DOUBLE',
          width: 1,
          color: { red: 0.1, green: 0.5, blue: 0.2 },
        },
      },
    });

    // 📌 10. Đóng băng header
    requests.push({
      updateSheetProperties: {
        properties: {
          sheetId,
          gridProperties: {
            frozenRowCount: headerRowEnd,
          },
        },
        fields: 'gridProperties.frozenRowCount',
      },
    });

    // 🎨 11. Conditional formatting cho links (CHỈ SỬ DỤNG CÁC THUỘC TÍNH HỖ TRỢ)
    requests.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [
            {
              sheetId,
              startRowIndex: dataRowStart,
              endRowIndex: dataRowEnd,
              startColumnIndex: 2, // Link column
              endColumnIndex: 3,
            },
          ],
          booleanRule: {
            condition: {
              type: 'NOT_BLANK',
            },
            format: {
              textFormat: {
                foregroundColor: { red: 0.0, green: 0.0, blue: 1.0 }, // Chỉ màu chữ xanh
                bold: true, // Thêm bold thay vì underline
              },
            },
          },
        },
        index: 0,
      },
    });

    // Apply tất cả formatting
    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadSheetId,
      requestBody: { requests },
    });
  }

  // Các method khác...
  async getAllSheets(): Promise<
    Array<{ name: string; id: number; index: number }>
  > {
    try {
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadSheetId,
      });

      const sheets =
        spreadsheet.data.sheets?.map((sheet) => ({
          name: sheet.properties?.title || 'Unknown',
          id: sheet.properties?.sheetId || 0,
          index: sheet.properties?.index || 0,
        })) || [];

      sheets.forEach((sheet) => {
        this.sheetCache.set(sheet.name, sheet.id);
      });

      return sheets;
    } catch (error) {
      this.logger.error('Error getting all sheets:', error);
      throw error;
    }
  }

  async createSheetIfNotExists(sheetName: string): Promise<number> {
    try {
      try {
        return await this.getSheetIdByName(sheetName);
      } catch (error) {
        this.logger.log(`📝 Creating new sheet: "${sheetName}"`);
      }

      const response = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadSheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                  gridProperties: { rowCount: 1000, columnCount: 15 },
                },
              },
            },
          ],
        },
      });

      const newSheetId =
        response.data.replies?.[0]?.addSheet?.properties?.sheetId;

      if (newSheetId === undefined) {
        throw new Error('Failed to create new sheet');
      }

      this.sheetCache.set(sheetName, newSheetId);
      return newSheetId;
    } catch (error) {
      this.logger.error(`❌ Error creating sheet "${sheetName}":`, error);
      throw error;
    }
  }
}

// Helper functions
function extractYtInitialData(html: string): any {
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/s);
  if (!match || match.length < 2) {
    throw new Error('ytInitialData not found');
  }

  try {
    return JSON.parse(match[1]);
  } catch (e) {
    throw new Error('Failed to parse ytInitialData JSON');
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
