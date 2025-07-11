// Test file to verify native notifications are working
import { NotificationHandler } from './notification';

export const testNotifications = async () => {
  console.log('Testing native notifications...');
  
  // Test success notification
  const successResult = await NotificationHandler.send({
    title: 'Test Success',
    body: 'This is a test success notification',
    icon: 'public/icons/icon.svg'
  });
  
  console.log('Success notification sent:', successResult);
  
  // Test error notification
  setTimeout(async () => {
    const errorResult = await NotificationHandler.send({
      title: 'Test Error',
      body: 'This is a test error notification',
      icon: 'public/icons/icon.svg'
    });
    
    console.log('Error notification sent:', errorResult);
  }, 2000);
};

// Uncomment the line below to test notifications
// testNotifications();
