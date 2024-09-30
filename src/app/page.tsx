'use client';
import { useState, useEffect } from 'react';

import Image from 'next/image';

export default function Home() {
  const [userName, setUserName] = useState('Loading...');
  const [totalHoursMonth, setTotalHoursMonth] = useState('Loading...');
  const [totalHoursWeek, setTotalHoursWeek] = useState('Loading...');
  const [totalHoursLastWeek, setTotalHoursLastWeek] = useState('Loading...');
  const [errorMessage, setErrorMessage] = useState('');

  const apiToken = process.env.NEXT_PUBLIC_TOGGL_API_TOKEN;

  // Helper function to get start and end dates of the week
  function getWeekStartAndEndDates(date: Date, offsetWeeks = 0) {
    const startOfWeek = new Date(date);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7; // Shift Sunday to 6 and other days as expected
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday + offsetWeeks * 7);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    return {
      startOfWeek: startOfWeek.toISOString(),
      endOfWeek: endOfWeek.toISOString(),
    };
  }

  useEffect(() => {
    async function fetchUserData() {
      try {
        const headers = new Headers();
        headers.set('Authorization', `Basic ${btoa(`${apiToken}:api_token`)}`);
        headers.set('Content-Type', 'application/json');

        // Fetch user details
        const userResponse = await fetch('https://api.track.toggl.com/api/v9/me', { headers });
        if (!userResponse.ok) throw new Error('Failed to fetch user data');
        const userData = await userResponse.json();
        setUserName(userData.fullname);

        // Get the current date
        const today = new Date();

        // Calculate first and last day of the current month
        let firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        let lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        firstDayOfMonth = new Date(today.getFullYear(), 8, 1).toISOString().split('T')[0];
        lastDayOfMonth = new Date(today.getFullYear(), 8, 31).toISOString().split('T')[0];

        console.log('firstDayOfMonth', firstDayOfMonth);
        console.log('lastDayOfMonth', lastDayOfMonth);

        // Calculate start and end dates for this week and last week
        const { startOfWeek: startOfThisWeek, endOfWeek: endOfThisWeek } = getWeekStartAndEndDates(today);
        const { startOfWeek: startOfLastWeek, endOfWeek: endOfLastWeek } = getWeekStartAndEndDates(today, -1);

        // Fetch time entries for the current month
        const timeEntriesMonthResponse = await fetch(`https://api.track.toggl.com/api/v9/me/time_entries?start_date=${firstDayOfMonth}&end_date=${lastDayOfMonth}`, { headers });
        if (!timeEntriesMonthResponse.ok) throw new Error('Failed to fetch time entries for the month');
        const timeEntriesMonth = await timeEntriesMonthResponse.json();

        // Fetch time entries for this week
        const timeEntriesWeekResponse = await fetch(`https://api.track.toggl.com/api/v9/me/time_entries?start_date=${startOfThisWeek}&end_date=${endOfThisWeek}`, { headers });
        if (!timeEntriesWeekResponse.ok) throw new Error('Failed to fetch time entries for this week');
        const timeEntriesWeek = await timeEntriesWeekResponse.json();

        // Fetch time entries for last week
        const timeEntriesLastWeekResponse = await fetch(`https://api.track.toggl.com/api/v9/me/time_entries?start_date=${startOfLastWeek}&end_date=${endOfLastWeek}`, { headers });
        if (!timeEntriesLastWeekResponse.ok) throw new Error('Failed to fetch time entries for last week');
        const timeEntriesLastWeek = await timeEntriesLastWeekResponse.json();

        // Helper function to calculate total hours
        const calculateTotalHours = (entries: { duration: number }[]) => {
          let totalHours = 0;
          entries.forEach((entry) => {
            if (entry.duration > 0) {
              totalHours += entry.duration / 3600; // Convert seconds to hours
            }
          });
          return totalHours.toFixed(2); // Return as a string with 2 decimals
        };

        // Set hours for the current month, current week, and last week
        setTotalHoursMonth(calculateTotalHours(timeEntriesMonth));
        setTotalHoursWeek(calculateTotalHours(timeEntriesWeek));
        setTotalHoursLastWeek(calculateTotalHours(timeEntriesLastWeek));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
        console.error('Error fetching data:', error);
      }
    }

    fetchUserData();
  });

  return (
    <div className="flex items-center justify-center flex-col min-h-screen">
      <Image className="mb-10" src="/images/sk-svg.svg" alt="Toggl Logo" width={100} height={100} />
      <h3 className="text-3xl mb-4">Toggl Time Report</h3>
      {errorMessage ? (
        <p className="text-red-500">Error: {errorMessage}</p>
      ) : (
        <>
          <p className="text-2xl">User: {userName}</p>
          <p className="text-xl">Hours worked this month: {totalHoursMonth}</p>
          <p className="text-xl">Hours worked this week: {totalHoursWeek}</p>
          <p className="text-xl">Hours worked last week: {totalHoursLastWeek}</p>
        </>
      )}
    </div>
  );
}
