import { HistoryScan, SceneAnalysis, SoundEvent } from '../types';

export const DEFAULT_LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1UVufVn1zPXRRkwkv1I4b3dlQcabWmP3C0Kl_uScLhlzuBS9WtMZDTIFC1DqlQkvQwFn56ctD70OCOprHOdB81aWoC33BlEhIRE9b_0jG-DFt5uuPbI33G0y08zT37s_Nl1FYhNrccOGuWcx3wXYGF1MKJ1lYmlciHzMCHnJ8KVq2aofk6NfQEd_g_XHjVOhNFsn5mRWqT1pT4V4_yOu3e4JJEU3oCSClDvFFyjpBAH1enNeoDg32MxFyA';

export const DEFAULT_SCENE_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCN1RyhYlZi-4eMwtOGVVu1yOWq3lcdPyjeB2E3yF4IY4H3UYB1L7H50K3kyk_dteXxW1epD8ybdzhhulZGHkIE1RvQTTVugy8jTpRJLuucbVtCgQv1AE5xMRs1AAcsnLfA3gDzhR-KJ3azwz4hwT1NXGG8Ad7u3EpAkWPUQtKJe8hy7_koQkhs9ryfl1ND_oKsmN0Ih8UX43rj8ZOOBsN_R22ap4xvRHveH5QFnWsfosHDtyCdL5zm0A';

export const DEFAULT_SCENE_ANALYSIS: SceneAnalysis = {
  immediateWalkingPath:
    'Clear hardwood floor leading forward about 8 feet toward an open kitchen doorway.',
  objectsInReach:
    'A ceramic white coffee mug is placed 2 feet to your right on a low wooden coffee table.',
  lightAndOrientation:
    'Bright daylight coming from a window on the left wall; kitchen overhead illumination is lit straight ahead.',
  obstacleAssessment:
    'No trip hazards, cables, or obstacles detected directly in your walking trajectory.',
  overallSummary:
    'Immediate path is clear ahead for 8 feet into kitchen. Coffee mug 2 feet to your right on table.',
  clarityScore: 98,
  verifiedSafe: true,
  modelName: 'Gemini 3.8 Flash',
};

export interface SamplePresetScene {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  fileSizeText: string;
  analysis: SceneAnalysis;
}

export const SAMPLE_SCENES: SamplePresetScene[] = [
  {
    id: 'living-room',
    name: 'Living Room Path',
    description: 'Polished hardwood floor with doorway leading to kitchen',
    imageUrl: DEFAULT_SCENE_IMAGE_URL,
    fileSizeText: 'Photo Ready (1.2 MB)',
    analysis: DEFAULT_SCENE_ANALYSIS,
  },
  {
    id: 'hallway-stairs',
    name: 'Residential Hallway',
    description: 'Straight carpeted hallway with bedroom doors on both sides',
    imageUrl:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
    fileSizeText: 'Photo Ready (1.5 MB)',
    analysis: {
      immediateWalkingPath:
        'Level carpeted hallway extending 12 feet ahead. Closed bathroom door on your left.',
      objectsInReach:
        'Wall-mounted coat rack 1 foot to your right with two winter jackets hanging.',
      lightAndOrientation:
        'Soft warm wall sconce lighting along upper right ceiling perimeter.',
      obstacleAssessment:
        'Small pair of slip-on shoes sitting against the left baseboard; main central path remains unobstructed.',
      overallSummary:
        'Carpeted hallway is safe to proceed straight ahead for 12 feet. Shoes resting on far left baseboard.',
      clarityScore: 95,
      verifiedSafe: true,
      modelName: 'Gemini 3.8 Flash',
    },
  },
  {
    id: 'kitchen-counter',
    name: 'Kitchen Workspace',
    description: 'Tile kitchen island with preparation counter',
    imageUrl:
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80',
    fileSizeText: 'Photo Ready (1.8 MB)',
    analysis: {
      immediateWalkingPath:
        'Smooth ceramic tile floor. Island counter corner located 3 feet ahead slightly left.',
      objectsInReach:
        'Stainless steel kettle sitting on cool stovetop 2.5 feet to your immediate left.',
      lightAndOrientation:
        'Diffused overhead pendant lamps directly illuminating the granite countertop workspace.',
      obstacleAssessment:
        'Cabinet door beneath kitchen sink is slightly ajar by 3 inches at knee height on your right.',
      overallSummary:
        'Kitchen island ahead 3 feet. Cabinet door slightly ajar on low right side.',
      clarityScore: 97,
      verifiedSafe: true,
      modelName: 'Gemini 3.8 Flash',
    },
  },
  {
    id: 'sidewalk-outdoor',
    name: 'Outdoor Pathway',
    description: 'Concrete walking sidewalk bordered by garden verge',
    imageUrl:
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1000&q=80',
    fileSizeText: 'Photo Ready (2.1 MB)',
    analysis: {
      immediateWalkingPath:
        'Straight textured concrete pavement continuing forward 20 feet toward pedestrian ramp.',
      objectsInReach:
        'Metal pedestrian handrail 2 feet to your right following gentle grade incline.',
      lightAndOrientation:
        'Direct afternoon sunlight from 2 o-clock position casting crisp shadows to the left.',
      obstacleAssessment:
        'Curbside step-down 15 feet ahead marking driveway crossing. Tactile paving truncated domes detected.',
      overallSummary:
        'Open pavement ahead for 15 feet before driveway transition. Handrail along your right side.',
      clarityScore: 99,
      verifiedSafe: true,
      modelName: 'Gemini 3.8 Flash',
    },
  },
];

export const INITIAL_SOUND_EVENTS: SoundEvent[] = [
  {
    id: 'sound-1',
    timestamp: 'Just now',
    label: 'Front Doorbell Chime',
    category: 'emergency',
    decibels: 76,
    directionDegrees: 35, // 1 o'clock
    distanceEstimate: 'Approx. 10 feet forward-right',
    urgent: true,
  },
  {
    id: 'sound-2',
    timestamp: '15s ago',
    label: 'Kettle Whistle / Steam',
    category: 'household',
    decibels: 68,
    directionDegrees: 345, // 11 o'clock
    distanceEstimate: 'Approx. 8 feet ahead',
    urgent: false,
  },
  {
    id: 'sound-3',
    timestamp: '1m ago',
    label: 'Approaching Soft Footsteps',
    category: 'voice',
    decibels: 54,
    directionDegrees: 180, // 6 o'clock (behind)
    distanceEstimate: 'Approx. 6 feet behind you',
    urgent: false,
  },
  {
    id: 'sound-4',
    timestamp: '3m ago',
    label: 'Refrigerator Compressor Hum',
    category: 'household',
    decibels: 42,
    directionDegrees: 310, // 10 o'clock
    distanceEstimate: 'Ambient kitchen background',
    urgent: false,
  },
];

export const INITIAL_HISTORY_SCANS: HistoryScan[] = [
  {
    id: 'hist-1',
    timestamp: Date.now() - 1000 * 60 * 12,
    displayTime: '12 minutes ago',
    locationLabel: 'Living Room (Front Path)',
    imageUrl: DEFAULT_SCENE_IMAGE_URL,
    analysis: DEFAULT_SCENE_ANALYSIS,
  },
  {
    id: 'hist-2',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    displayTime: '2 hours ago',
    locationLabel: 'Kitchen Counter',
    imageUrl: SAMPLE_SCENES[2].imageUrl,
    analysis: SAMPLE_SCENES[2].analysis,
  },
  {
    id: 'hist-3',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    displayTime: '5 hours ago',
    locationLabel: 'Entrance Hallway',
    imageUrl: SAMPLE_SCENES[1].imageUrl,
    analysis: SAMPLE_SCENES[1].analysis,
  },
];
