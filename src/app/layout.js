'use client';

import { AuthProvider } from './contexts/AuthContext';
import { TopUpProvider } from './contexts/TopUpContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { TicketProvider } from './contexts/TicketContext';
import { EventProvider } from './contexts/EventContext';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <EventProvider>
            <TicketProvider>
              <TopUpProvider>
                <TransactionProvider>
                  {children}
                </TransactionProvider>
              </TopUpProvider>
            </TicketProvider>
          </EventProvider>
        </AuthProvider>
      </body>
    </html>
  );
}