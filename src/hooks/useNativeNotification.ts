import { NotificationHandler } from '../lib/notifications/notification';

export const useNativeNotification = () => {
  const showSuccessNotification = async (message: string) => {
    await NotificationHandler.send({
      title: 'Éxito',
      body: message,
      icon: 'public/icons/icon.svg'
    });
  };

  const showErrorNotification = async (message: string) => {
    await NotificationHandler.send({
      title: 'Error',
      body: message,
      icon: 'public/icons/icon.svg'
    });
  };

  const showInfoNotification = async (message: string) => {
    await NotificationHandler.send({
      title: 'Información',
      body: message,
      icon: 'public/icons/icon.svg'
    });
  };

  const showNotification = async (type: 'success' | 'error' | 'info', message: string) => {
    switch (type) {
      case 'success':
        await showSuccessNotification(message);
        break;
      case 'error':
        await showErrorNotification(message);
        break;
      case 'info':
        await showInfoNotification(message);
        break;
    }
  };

  return {
    showSuccessNotification,
    showErrorNotification,
    showInfoNotification,
    showNotification,
  };
};
