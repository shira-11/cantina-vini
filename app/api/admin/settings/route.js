import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: { key: { in: ['visitor_allowed_filters', 'visitor_allow_wine_details', 'login_page_background'] } }
    });

    const filtersSetting = settings.find(s => s.key === 'visitor_allowed_filters');
    const wineDetailsSetting = settings.find(s => s.key === 'visitor_allow_wine_details');
    const loginBgSetting = settings.find(s => s.key === 'login_page_background');

    let allowedFilters = [
      'country', 'region', 'producerCellar', 'producer',
      'classification', 'category', 'location', 'availability',
      'photo', 'bottleType'
    ]; // Default: all allowed

    if (filtersSetting && filtersSetting.value) {
      try {
        allowedFilters = JSON.parse(filtersSetting.value);
      } catch (e) {
        console.error("Error parsing settings JSON", e);
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

    return NextResponse.json({
      visitorAllowedFilters: allowedFilters,
      visitorAllowWineDetails: allowWineDetails,
      loginPageBackground
    });
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { visitorAllowedFilters, visitorAllowWineDetails, loginPageBackground } = body;

    if (!Array.isArray(visitorAllowedFilters)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const filterSettings = await prisma.systemSettings.upsert({
      where: { key: 'visitor_allowed_filters' },
      update: { value: JSON.stringify(visitorAllowedFilters) },
      create: { key: 'visitor_allowed_filters', value: JSON.stringify(visitorAllowedFilters) }
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

    return NextResponse.json({
      success: true,
      visitorAllowedFilters: JSON.parse(filterSettings.value),
      visitorAllowWineDetails: wineDetailsSettings.value === 'true',
      loginPageBackground: loginBgSettings.value === 'true'
    });
  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
