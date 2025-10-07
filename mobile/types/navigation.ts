// Navigation types for Expo Router

export type RootStackParamList = {
  '(auth)/login': undefined;
  '(auth)/register': undefined;
  '(tabs)/dashboard': undefined;
  '(tabs)/clients': undefined;
  '(tabs)/conversations': undefined;
  '(tabs)/aurora': undefined;
  '(tabs)/settings': undefined;
  'client/[id]': { id: string };
  'client/new': undefined;
  'client/edit/[id]': { id: string };
  'conversation/[id]': { id: string };
  'booking/new': { contactId?: string; petId?: string };
  'booking/[id]': { id: string };
  'booking/edit/[id]': { id: string };
  'pet/[id]': { id: string; contactId: string };
  'pet/new': { contactId: string };
};

export type TabParamList = {
  dashboard: undefined;
  clients: undefined;
  conversations: undefined;
  aurora: undefined;
  settings: undefined;
};

export type AuthParamList = {
  login: undefined;
  register: undefined;
};

// Screen props helpers
export type ScreenProps<T extends keyof RootStackParamList> = {
  route: {
    params: RootStackParamList[T];
  };
  navigation: any; // Will be typed by expo-router
};
