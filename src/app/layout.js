'use client';

import { AuthProvider } from './contexts/AuthContext';
import { TopUpProvider } from './contexts/TopUpContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { TicketProvider } from './contexts/TicketContext';
import { EventProvider } from './contexts/EventContext';
import { ReportProvider } from './contexts/ReportContext';
import './globals.css';

import { NotificationProvider } from './contexts/NotificationContext';
import { AdminUserProvider } from './contexts/AdminUserContext';
import { AdminTicketProvider } from './contexts/AdminTicketContext';
import { AdminTransactionProvider } from './contexts/AdminTransactionContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AdminUserProvider>
            <EventProvider>
              <AdminTicketProvider>
                <AdminTransactionProvider>
                  <TicketProvider>
                    <TopUpProvider>
                      <TransactionProvider>
                        <ReportProvider>
                          <NotificationProvider>
                            {children}
                          </NotificationProvider>
                        </ReportProvider>
                      </TransactionProvider>
                    </TopUpProvider>
                  </TicketProvider>
                </AdminTransactionProvider>
              </AdminTicketProvider>
            </EventProvider>
          </AdminUserProvider>
        </AuthProvider>
      </body>
    </html>
  );
}