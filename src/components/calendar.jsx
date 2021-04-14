import React, { useEffect, useState } from 'react';
import './calendar.css';
import convert from 'xml-js';

let temp;
const Calendar = () => {
  //현재 날짜를 가지고옴
  const [date, setDate] = useState(new Date());
  const [year, setYear] = useState(date.getFullYear());
  const [month, setMonth] = useState(date.getMonth() + 1);
  //현재 month에서 오늘 날짜가 들어있는 index를 확인하기 위한 변수
  const [todayIndex, setTodayIndex] = useState();
  //오늘 날짜를 찾았을 경우 렌더링을 활성화할 트리거
  const [isFinded, setIsFinded] = useState(false);
  //현재 month를 임시변수 temp에 한번만 저장할 트리거
  const [isOnce, setIsOnce] = useState(false);
  //현재 month를 기준으로 공휴일 객체를 저장할곳
  const [holiday, setHoliday] = useState([]);
  //현재 month와 비교하여 공휴일이 어디에 있는지 index를 확인하기 위한 변수
  const [holidayIndex, setHolidayIndex] = useState();
  const [isloading, setIsloading] = useState(false);
  const newDate = `${year}년 ${month}월`;
  const apiKey = process.env.REACT_APP_API_KEY;

  //지난달 마지막 date, 이번달 마지막 date
  const prevLast = new Date(year, month - 1, 0);
  const thisLast = new Date(year, month, 0);

  //이전달 날짜, 요일(0:일 ~ 6:토)
  const prevDate = prevLast.getDate();
  const prevDay = prevLast.getDay();

  //이번달 날짜, 요일(0:일 ~ 6:토)
  const thisDate = thisLast.getDate();
  const thisDay = thisLast.getDay();

  //이전달, 현재달, 다음달을 저장할 배열
  const prevDates = [];
  const thisDates = [...Array(thisDate + 1).keys()].slice(1);
  const nextDates = [];

  if (prevDay !== 6) {
    for (let i = 0; i < prevDay + 1; i++) {
      prevDates.unshift(prevDate - i);
    }
  }
  //7일씩 6주의 레이아웃으로 구성
  const len = 42 - (prevDates.length + thisDates.length);
  for (let i = 1; i <= len; i++) {
    nextDates.push(i);
  }

  //한 화면에 표시할 전체의 day의 배열
  const dates = [...prevDates, ...thisDates, ...nextDates];

  useEffect(() => {
    if (!isOnce) {
      temp = [...thisDates];
      setIsOnce(true);
    }
  }, [isOnce]);

  //이전달 버튼
  const prevMonth = () => {
    if (month === 1) {
      setYear((prev) => prev - 1);
      setMonth(12);
    } else {
      setMonth((prev) => prev - 1);
    }
    setIsFinded(false);
  };
  //오늘 날짜로 이동 버튼
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
  //다음달 버튼
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

  //숫자가 한자리 수 month or day일 경우 앞에 '0'을 붙여서 두자리로 표기
  const makeZeroString = (number) => {
    let numberStr = '0' + number;
    numberStr = numberStr.slice(-2);
    return numberStr;
  };

  //공휴일 api url
  const url = (myyear, mymonth) => {
    return `/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?solYear=${myyear}&solMonth=${mymonth}&ServiceKey=${apiKey}`;
  };

  //공휴일 api를 호출하여 실행할 함수
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
  //이전달 다음달 이동시 month가 변경될때마다 공휴일 api를 호출하여 데이터를 가져옴
  useEffect(() => {
    search();
  }, [month]);

  //공휴일 객체가 생기면 각각 필요한 인덱스를 알아내기 위한 훅
  useEffect(() => {
    if (holiday) {
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

  //클릭 이벤트로 해당 일자에 이벤트를 추가할 함수
  const onClick = (e) => {
    let onDiv = document.createElement('div');
    onDiv.innerHTML = window.prompt('이벤트 이름 입력', '새로운 이벤트');
    onDiv.className = `event`;
    document.getElementsByClassName(e.target.className)[0].append(onDiv);
  };

  return (
    <div className='container'>
      {isloading ? (
        <>
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
            <div className={`month ${month}`}>
              {/* 이전 달 */}
              {prevDates.map((date, index) => {
                return (
                  <div key={index} style={{ color: 'grey' }}>
                    <p>{date}일</p>
                  </div>
                );
              })}

              {/* 현재 달 */}
              {thisDates.map((date, index) => {
                let test = <p>{date}일</p>;
                if (index === 0) {
                  test = (
                    <p>
                      {month}월 {date}일
                    </p>
                  );
                }
                holidayIndex.map((hol, idx) => {
                  if (index === hol && index === 0) {
                    test = (
                      <>
                        <p>
                          {month}월 {date}일
                        </p>
                        {holiday.length !== 0 && holiday[idx] && (
                          <div className='holiday'>{holiday[idx].name}</div>
                        )}
                      </>
                    );
                  } else if (index === hol) {
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
                const key = `${year}${makeZeroString(month)}${makeZeroString(
                  date
                )}`;

                return (
                  <div key={key} className={key} onClick={onClick}>
                    {test}
                  </div>
                );
              })}

              {/* 다음 달 */}
              {nextDates.map((date, index) => {
                return (
                  <div key={index} style={{ color: 'grey' }}>
                    <p>{date}일</p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div></div>
      )}
    </div>
  );
};

export default Calendar;
