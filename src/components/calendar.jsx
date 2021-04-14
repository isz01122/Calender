import React, { useEffect, useState } from 'react';
import './calendar.css';
import convert from 'xml-js';

let temp;
const Calendar = () => {
  const [date, setDate] = useState(new Date());
  const [year, setYear] = useState(date.getFullYear());
  const [month, setMonth] = useState(date.getMonth() + 1);
  const [todayIndex, setTodayIndex] = useState();
  const [isFinded, setIsFinded] = useState(false);
  const [isOnce, setIsOnce] = useState(false);
  const [holiday, setHoliday] = useState([]);
  const [holidayIndex, setHolidayIndex] = useState();
  const [isloading, setIsloading] = useState(false);
  const apiKey = process.env.REACT_APP_API_KEY;
  const newDate = `${year}년 ${month}월`;

  //지난달 마지막 date, 이번달 마지막 date
  const prevLast = new Date(year, month - 1, 0);
  const thisLast = new Date(year, month, 0);

  //이전달 날짜, 요일(0:일 ~ 6:토)
  const prevDate = prevLast.getDate();
  const prevDay = prevLast.getDay();

  //이번달 날짜, 요일(0:일 ~ 6:토)
  const thisDate = thisLast.getDate();
  const thisDay = thisLast.getDay();

  const prevDates = [];
  const thisDates = [...Array(thisDate + 1).keys()].slice(1);
  const nextDates = [];

  if (prevDay !== 6) {
    for (let i = 0; i < prevDay + 1; i++) {
      prevDates.unshift(prevDate - i);
    }
  }
  const len = 42 - (prevDates.length + thisDates.length);
  for (let i = 1; i <= len; i++) {
    nextDates.push(i);
  }

  const dates = [...prevDates, ...thisDates, ...nextDates];

  useEffect(() => {
    if (!isOnce) {
      // temp = [...dates];
      temp = [...thisDates];
      setIsOnce(true);
    }
  }, [isOnce]);

  const prevMonth = () => {
    if (month === 1) {
      setYear((prev) => prev - 1);
      setMonth(12);
    } else {
      setMonth((prev) => prev - 1);
    }
    setIsFinded(false);
  };
  const goToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const findToday = temp.findIndex((element, index) => {
      if (element === date.getDate()) return index;
    });
    setYear(year);
    setMonth(month);
    setTodayIndex(findToday);
    setIsFinded(true);
  };
  const nextMonth = () => {
    if (month === 12) {
      setYear((prev) => prev + 1);
      setMonth(1);
    } else {
      setMonth((prev) => prev + 1);
    }
    setIsFinded(false);
  };
  //현재 월을 기준으로 이전달과 다음달의 나머지 날짜는 흐림으로 처리
  const prevIndex = prevDates.length - 1;
  const thisIndex = prevIndex + thisDates.length;

  const url = (myyear, mymonth) => {
    return `/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?solYear=${myyear}&solMonth=${mymonth}&ServiceKey=${apiKey}`;
  };

  const makeZeroString = (number) => {
    let numberStr = '0' + number;
    numberStr = numberStr.slice(-2);
    return numberStr;
  };

  const search = () => {
    const requestOptions = {
      method: 'GET',
      redirect: 'follow',
      headers: { 'Access-Control-Allow-Origin': '*' },
    };
    fetch(url(year, makeZeroString(month)), requestOptions)
      .then((response) => response.text())
      .then((result) => {
        let xml = convert.xml2json(result, { compact: false, spaces: 4 });
        xml = JSON.parse(xml);

        const dates = xml.elements[0].elements[1].elements[0].elements;
        const dateArr = [];
        if (dates.length !== 0) {
          for (let i = 0; i < dates.length; i++) {
            const { elements: dateObj } = dates[i];
            const obj = {
              name: dateObj[1].elements[0].text,
              date: dateObj[3].elements[0].text.slice(6, 8),
            };
            dateArr.push(obj);
          }
          setHoliday(dateArr);
        }
      })
      .catch((error) => {
        setHoliday([]);
      });
  };

  useEffect(() => {
    search();
  }, [month]);

  useEffect(() => {
    if (holiday) {
      console.log(holiday);
      const arr = holiday.map((item) => {
        return parseInt(item.date);
      });
      const findIndex = [];
      for (let i = 0; i < arr.length; i++) {
        let findHoliday = thisDates.findIndex((element, index) => {
          if (element === arr[i]) {
            return index;
          }
        });
        if (findHoliday === -1) {
          findHoliday = 0;
        }
        findIndex.push(findHoliday);
      }
      setHolidayIndex(findIndex);
      setIsloading(true);
    }
  }, [holiday]);

  return (
    isloading && (
      <div className='container'>
        <div className='header'>
          <div className='date'>{newDate}</div>
          <div className='pageNavi'>
            <button onClick={prevMonth}>&lt;</button>
            <button onClick={goToday}>오늘</button>
            <button onClick={nextMonth}>&gt;</button>
          </div>
        </div>
        <div className='day'>
          <div>일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div>토</div>
        </div>
        <div className='body'>
          <div className='week'>
            {/* 이전 달 */}
            {prevDates.map((date) => {
              return (
                <div style={{ color: 'grey' }}>
                  <p>{date}일</p>
                </div>
              );
            })}

            {/* 현재 달 */}
            {thisDates.map((date, index) => {
              let test = <p>{date}일</p>;
              holidayIndex.map((hol, idx) => {
                if (index === hol) {
                  test = (
                    <>
                      <p>{date}일</p>
                      {holiday.length !== 0 && holiday[idx] && (
                        <div className='holiday'>{holiday[idx].name}</div>
                      )}
                    </>
                  );
                }
              });
              if (isFinded && index === todayIndex) {
                test = (
                  <p>
                    <span className='today'>{date}</span>일
                  </p>
                );
              }

              return <div className={`day${index + 1}`}>{test}</div>;
            })}

            {/* 다음 달 */}
            {nextDates.map((date) => {
              return (
                <div style={{ color: 'grey' }}>
                  <p>{date}일</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )
  );
};

export default Calendar;
