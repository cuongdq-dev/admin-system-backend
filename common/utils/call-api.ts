import { BadRequestException } from '@nestjs/common';

export async function callApi(
  url: string,
  method: string,
  body?: Record<string, any>,
) {
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.ok) {
      const textResponse = await response.text();
      if (!textResponse) {
        throw new BadRequestException('Empty response from API');
      }

      const data = JSON.parse(textResponse);
      return data;
    } else {
      const errorData = await response.json();
      throw new BadRequestException(errorData.message || 'API request failed');
    }
  } catch (error) {
    console.error('API Error:', error);
    throw new BadRequestException(error);
  }
}
