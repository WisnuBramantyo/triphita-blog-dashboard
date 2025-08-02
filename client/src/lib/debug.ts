// Debug utility functions
export const debug = {
  log: (label: string, data: any) => {
    if (import.meta.env.DEV) {
      console.log(`🐛 ${label}:`, data);
    }
  },
  
  error: (label: string, error: any) => {
    console.error(`❌ ${label}:`, error);
  },
  
  api: (method: string, url: string, data?: any) => {
    if (import.meta.env.DEV) {
      console.log(`🌐 ${method} ${url}`, data ? data : '');
    }
  },
  
  component: (componentName: string, props: any) => {
    if (import.meta.env.DEV) {
      console.log(`🔧 ${componentName} props:`, props);
    }
  }
};