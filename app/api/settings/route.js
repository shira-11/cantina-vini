import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: ['visitor_allowed_filters', 'visitor_allow_wine_details', 'login_page_background', 'photo_preview_seconds', 'visitor_allowed_buttons', 'enable_search_autocomplete', 'deletion_pin'] } }
    });

    const filtersSetting = settings.find(s => s.key === 'visitor_allowed_filters');
    const wineDetailsSetting = settings.find(s => s.key === 'visitor_allow_wine_details');
    const loginBgSetting = settings.find(s => s.key === 'login_page_background');
    const photoSecSetting = settings.find(s => s.key === 'photo_preview_seconds');
    const buttonsSetting = settings.find(s => s.key === 'visitor_allowed_buttons');
    const autoSetting = settings.find(s => s.key === 'enable_search_autocomplete');
    const pinSetting = settings.find(s => s.key === 'deletion_pin');

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

    return NextResponse.json({
      visitorAllowedFilters: allowedFilters,
      visitorAllowedButtons: allowedButtons,
      visitorAllowWineDetails: allowWineDetails,
      loginPageBackground: loginPageBackground,
      photoPreviewSeconds: photoPreviewSeconds,
      enableSearchAutocomplete: enableSearchAutocomplete,
      deletionPin: deletionPin
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: error?.message || String(error), stack: error?.stack }, { status: 500 });
  }
}
