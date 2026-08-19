import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: ['visitor_allowed_filters', 'visitor_allow_wine_details', 'login_page_background', 'photo_preview_seconds', 'visitor_allowed_buttons'] } }
    });

    const filtersSetting = settings.find(s => s.key === 'visitor_allowed_filters');
    const wineDetailsSetting = settings.find(s => s.key === 'visitor_allow_wine_details');
    const loginBgSetting = settings.find(s => s.key === 'login_page_background');
    const photoSecSetting = settings.find(s => s.key === 'photo_preview_seconds');
    const buttonsSetting = settings.find(s => s.key === 'visitor_allowed_buttons');

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

    return NextResponse.json({
      visitorAllowedFilters: allowedFilters,
      visitorAllowedButtons: allowedButtons,
      visitorAllowWineDetails: allowWineDetails,
      loginPageBackground,
      photoPreviewSeconds
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
    const { visitorAllowedFilters, visitorAllowedButtons, visitorAllowWineDetails, loginPageBackground, photoPreviewSeconds } = body;

    if (!Array.isArray(visitorAllowedFilters)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const filterSettings = await prisma.systemSettings.upsert({
      where: { key: 'visitor_allowed_filters' },
      update: { value: JSON.stringify(visitorAllowedFilters) },
      create: { key: 'visitor_allowed_filters', value: JSON.stringify(visitorAllowedFilters) }
    });

    const targetButtons = Array.isArray(visitorAllowedButtons) ? visitorAllowedButtons : [
      'print_scheda', 'print_nazioni', 'print_pdf',
      'export_excel', 'history_log', 'inventory'
    ];
    const buttonSettings = await prisma.systemSettings.upsert({
      where: { key: 'visitor_allowed_buttons' },
      update: { value: JSON.stringify(targetButtons) },
      create: { key: 'visitor_allowed_buttons', value: JSON.stringify(targetButtons) }
    });

    let allowWineDetailsStr = visitorAllowWineDetails === false ? 'false' : 'true';
    const wineDetailsSettings = await prisma.systemSettings.upsert({
      where: { key: 'visitor_allow_wine_details' },
      update: { value: allowWineDetailsStr },
      create: { key: 'visitor_allow_wine_details', value: allowWineDetailsStr }
    });

    let loginBgStr = loginPageBackground === false ? 'false' : 'true';
    const loginBgSettings = await prisma.systemSettings.upsert({
      where: { key: 'login_page_background' },
      update: { value: loginBgStr },
      create: { key: 'login_page_background', value: loginBgStr }
    });

    let photoSecStr = String(photoPreviewSeconds || 3);
    const photoSecSettings = await prisma.systemSettings.upsert({
      where: { key: 'photo_preview_seconds' },
      update: { value: photoSecStr },
      create: { key: 'photo_preview_seconds', value: photoSecStr }
    });

    return NextResponse.json({
      success: true,
      visitorAllowedFilters: JSON.parse(filterSettings.value),
      visitorAllowedButtons: JSON.parse(buttonSettings.value),
      visitorAllowWineDetails: wineDetailsSettings.value === 'true',
      loginPageBackground: loginBgSettings.value === 'true',
      photoPreviewSeconds: parseInt(photoSecSettings.value, 10) || 3
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
