import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: ['visitor_allowed_filters', 'visitor_allow_wine_details', 'login_page_background', 'photo_preview_seconds', 'visitor_allowed_buttons', 'enable_search_autocomplete', 'deletion_pin', 'gemini_api_key'] } }
    });

    const filtersSetting = settings.find(s => s.key === 'visitor_allowed_filters');
    const wineDetailsSetting = settings.find(s => s.key === 'visitor_allow_wine_details');
    const loginBgSetting = settings.find(s => s.key === 'login_page_background');
    const photoSecSetting = settings.find(s => s.key === 'photo_preview_seconds');
    const buttonsSetting = settings.find(s => s.key === 'visitor_allowed_buttons');
    const autoSetting = settings.find(s => s.key === 'enable_search_autocomplete');
    const pinSetting = settings.find(s => s.key === 'deletion_pin');
    const geminiSetting = settings.find(s => s.key === 'gemini_api_key');

    let allowedFilters = [
      'country', 'region', 'producerCellar', 'producer',
      'classification', 'category', 'location', 'availability',
      'photo', 'bottleType'
    ];

    if (filtersSetting && filtersSetting.value) {
      try {
        allowedFilters = JSON.parse(filtersSetting.value);
      } catch (e) {
        console.error("Error parsing settings JSON", e);
      }
    }

    let allowedButtons = [
      'print_scheda', 'print_nazioni', 'print_pdf',
      'export_excel', 'history_log', 'inventory'
    ];

    if (buttonsSetting && buttonsSetting.value) {
      try {
        allowedButtons = JSON.parse(buttonsSetting.value);
      } catch (e) {
        console.error("Error parsing allowedButtons JSON", e);
      }
    }

    let allowWineDetails = true;
    if (wineDetailsSetting && wineDetailsSetting.value) {
      allowWineDetails = wineDetailsSetting.value === 'true';
    }

    let loginPageBackground = true;
    if (loginBgSetting && loginBgSetting.value) {
      loginPageBackground = loginBgSetting.value === 'true';
    }

    let photoPreviewSeconds = 3;
    if (photoSecSetting && photoSecSetting.value) {
      photoPreviewSeconds = parseInt(photoSecSetting.value, 10) || 3;
    }

    let enableSearchAutocomplete = true;
    if (autoSetting && autoSetting.value) {
      enableSearchAutocomplete = autoSetting.value === 'true';
    }

    let deletionPin = '1234';
    if (pinSetting && pinSetting.value) {
      deletionPin = pinSetting.value;
    }

    let geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    if (geminiSetting && geminiSetting.value) {
      geminiApiKey = geminiSetting.value;
    }

    return NextResponse.json({
      visitorAllowedFilters: allowedFilters,
      visitorAllowedButtons: allowedButtons,
      visitorAllowWineDetails: allowWineDetails,
      loginPageBackground: loginPageBackground,
      photoPreviewSeconds: photoPreviewSeconds,
      enableSearchAutocomplete: enableSearchAutocomplete,
      deletionPin: deletionPin,
      geminiApiKey: geminiApiKey
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { visitorAllowedFilters, visitorAllowedButtons, visitorAllowWineDetails, loginPageBackground, photoPreviewSeconds, enableSearchAutocomplete, deletionPin, geminiApiKey } = body;

    if (!Array.isArray(visitorAllowedFilters)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    await prisma.systemSettings.upsert({
      where: { key: 'visitor_allowed_filters' },
      update: { value: JSON.stringify(visitorAllowedFilters) },
      create: { key: 'visitor_allowed_filters', value: JSON.stringify(visitorAllowedFilters) }
    });

    if (Array.isArray(visitorAllowedButtons)) {
      await prisma.systemSettings.upsert({
        where: { key: 'visitor_allowed_buttons' },
        update: { value: JSON.stringify(visitorAllowedButtons) },
        create: { key: 'visitor_allowed_buttons', value: JSON.stringify(visitorAllowedButtons) }
      });
    }

    await prisma.systemSettings.upsert({
      where: { key: 'visitor_allow_wine_details' },
      update: { value: String(visitorAllowWineDetails) },
      create: { key: 'visitor_allow_wine_details', value: String(visitorAllowWineDetails) }
    });

    await prisma.systemSettings.upsert({
      where: { key: 'login_page_background' },
      update: { value: String(loginPageBackground) },
      create: { key: 'login_page_background', value: String(loginPageBackground) }
    });

    await prisma.systemSettings.upsert({
      where: { key: 'photo_preview_seconds' },
      update: { value: String(photoPreviewSeconds) },
      create: { key: 'photo_preview_seconds', value: String(photoPreviewSeconds) }
    });

    await prisma.systemSettings.upsert({
      where: { key: 'enable_search_autocomplete' },
      update: { value: String(enableSearchAutocomplete) },
      create: { key: 'enable_search_autocomplete', value: String(enableSearchAutocomplete) }
    });

    if (deletionPin) {
      await prisma.systemSettings.upsert({
        where: { key: 'deletion_pin' },
        update: { value: String(deletionPin) },
        create: { key: 'deletion_pin', value: String(deletionPin) }
      });
    }

    if (geminiApiKey !== undefined) {
      await prisma.systemSettings.upsert({
        where: { key: 'gemini_api_key' },
        update: { value: String(geminiApiKey).trim() },
        create: { key: 'gemini_api_key', value: String(geminiApiKey).trim() }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving admin settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
