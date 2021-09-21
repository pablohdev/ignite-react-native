import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

import HighlightCard from "../../components/HighlightCard";
import Header from "../../components/Header";
import TransactionCard from "../../components/TransactionCard";

import { styles } from "./styles";

import { ITransactionProps } from "../../components/TransactionCard";
import { month } from "../../utils/date";
interface DataListProps extends ITransactionProps {
  id: string;
}

interface IHighlightProps {
  amount: string;
}
interface IHighlightData {
  entries: IHighlightProps;
  expensive: IHighlightProps;
  total: IHighlightProps;
}

type typeProp = "Income" | "Outcome";

const firstDateTransaction = (transactions: DataListProps[]) => {
  const dates = transactions
    .map((transaction: ITransactionProps) => transaction.date)
    .sort();

  const firstDate = dates[0].split("")[0] + dates[0].split("")[1];

  return `${firstDate}th`;
};

const latestDate = (transactions: DataListProps[], type: typeProp) => {
  const majorDate = transactions
    .filter((transaction: ITransactionProps) => transaction.type === type)
    .map((transaction: ITransactionProps) => transaction.date)
    .sort()
    .reverse()[0];

  return majorDate;
};

const latestDay = (date: DataListProps[], type: typeProp) => {
  const dateSplited = latestDate(date, type).split("");
  const day = dateSplited[0] + dateSplited[1];

  return `${day}th`;
};

const lastMonthTotal = (date: DataListProps[]) => {
  const dates = date
    .map((transaction: ITransactionProps) => transaction.date)
    .sort()
    .reverse();

  const lastMonth = dates[0];

  return month(lastMonth);
};

const latestDayTotal = (date: DataListProps[]) => {
  const dates = date
    .map((transaction: ITransactionProps) => transaction.date)
    .sort()
    .reverse();

  const firstDate = dates[0].split("")[0] + dates[0].split("")[1];

  return `${firstDate}th`;
};

const Dashboard = (): JSX.Element => {
  const [data, setData] = useState<DataListProps[]>([]);
  const [highlightData, setHighlightData] = useState<IHighlightData>(
    {} as IHighlightData
  );
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    const transactionsKey = "@gofinances:transactions";
    const response = await AsyncStorage.getItem(transactionsKey);

    let entriesTotal = 0;
    let expensivesTotal = 0;

    const allTransactions = response ? JSON.parse(response) : [];

    const transactionsFormatted: DataListProps[] = allTransactions.map(
      (item: DataListProps) => {
        if (item.type === "Income") {
          entriesTotal += Number(item.amount);
        } else {
          expensivesTotal += Number(item.amount);
        }

        const amount = Number(item.amount).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        const date = Intl.DateTimeFormat("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }).format(new Date(item.date));

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          type: item.type,
          amount: amount,
          date: date,
        };
      }
    );

    const total = entriesTotal - expensivesTotal;

    setData(transactionsFormatted);
    setHighlightData({
      entries: {
        amount: entriesTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      },
      expensive: {
        amount: expensivesTotal.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      },
      total: {
        amount: total.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      },
    });
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      {isLoading ? (
        <ActivityIndicator color={"#fff"} />
      ) : (
        <>
          <Header onPress={() => {}} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <HighlightCard
              title="Receipts"
              amount={highlightData?.entries?.amount}
              lastTransaction={
                data.some((item) => item.type === "Income")
                  ? `Last entry was ${month(
                      latestDate(data, "Income")
                    )} ${latestDay(data, "Income")}`
                  : ""
              }
              type="up"
            />
            <HighlightCard
              title="Outflows"
              amount={highlightData?.expensive?.amount}
              lastTransaction={
                data.some((item) => item.type === "Outcome")
                  ? `Last out was ${month(
                      latestDate(data, "Outcome")
                    )} ${latestDay(data, "Outcome")}`
                  : ""
              }
              type="down"
            />
            <HighlightCard
              title="Total"
              amount={highlightData.total.amount}
              lastTransaction={
                data.some((item) => item.type === "Income") ||
                data.some((item) => item.type === "Outcome")
                  ? `${lastMonthTotal(data)} from ${firstDateTransaction(
                      data
                    )} to ${latestDayTotal(data)}`
                  : ""
              }
              type="total"
            />
          </ScrollView>

          {data.length >= 1 ? <Text style={styles.title}>Listing</Text> : <></>}

          <FlatList
            style={{ flex: 0 }}
            initialNumToRender={data.length}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ marginBottom: 40 }}
            data={data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TransactionCard data={item} />}
          />

          <View style={{ height: 20, marginBottom: 20 }} />
        </>
      )}
    </ScrollView>
  );
};

export default Dashboard;
