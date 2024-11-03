import PassagemCardUser from "./passagemCardUser";
import { ScrollArea } from "@/components/ui/scroll-area";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

interface Passagem {
  id:string,
  origem: string;
  destino: string;
  preco?: number;
  imagemSrc: string;
  assento: string;
  id_voo: string;
}

interface Voo {
  origem: string;
  destino: string;
  capacidade_voo: number;
  companhia_aerea: string;
  preco: number;
  imagem_companhia: string;
}

interface PassagemComVoo extends Passagem {
  capacidade_voo?: number;
  companhia_aerea?: string;
  preco_voo?: number;
  imagem_companhia?: string;
}

function ListTickets() {
  const [passagens, setPassagens] = useState<PassagemComVoo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getVooDetails = async (id_voo: string): Promise<Voo | null> => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/voo/find/?voo_id=${id_voo}`);
      const voo = response.data.voos ? response.data.voos[0] : null; // Acessa o primeiro elemento do array 'voos'
      return voo;
    } catch (err) {
      console.error("Erro ao carregar detalhes do voo:", err);
      return null;
    }
  };

  const fetchAllTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
  
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
  
    if (!user || !token) {
      setError("Usuário ou token não encontrado.");
      setLoading(false);
      return;
    }
  
    const userDecode = JSON.parse(user);
  
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/ticket/?user_id=${userDecode.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      const tickets = response.data.tickets || [];
      console.log("Passagens recebidas:", tickets);
  

      const mapTicketWithVoo = async (passagem: Passagem) => {
        try {
          const vooDetails = await getVooDetails(passagem.id_voo);
          console.log(`Detalhes do voo para ID ${passagem.id_voo}:`, vooDetails);

          if (!vooDetails) {
            console.warn(`Detalhes do voo não encontrados para ID: ${passagem.id_voo}`);
            return { ...passagem };
          }
  

          return {
            ...passagem,
            origem: vooDetails.origem,
            destino: vooDetails.destino,
            capacidade_voo: vooDetails.capacidade_voo,
            companhia_aerea: vooDetails.companhia_aerea,
            preco_voo: vooDetails.preco,
            imagem_companhia: vooDetails.imagem_companhia ,
          };
        } catch (error) {
          console.error(`Erro ao combinar passagem com voo para ID ${passagem.id_voo}:`, error);
          return { ...passagem }; // Retorna a passagem sem detalhes de voo em caso de erro
        }
      };
  
      // Utilizando `Promise.all` para esperar todos os mapeamentos serem completados
      const passagensComVoos = await Promise.all(tickets.map(mapTicketWithVoo));
      console.log("Passagens combinadas com detalhes de voos:", passagensComVoos);
  
      setPassagens(passagensComVoos);
    } catch (err) {
      console.error("Erro ao carregar passagens:", err);
      const errorMsg = err.response?.data?.detail || "Erro ao carregar todas as passagens.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);
  
  

  useEffect(() => {
    fetchAllTickets();
  }, [fetchAllTickets]);

  return (
    <section className="max-w-4xl mx-auto">
      {loading ? (
        <p>Carregando...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ScrollArea className="h-screen">
          {passagens.length > 0 ? (
            passagens.map((passagem, index) => (
              <PassagemCardUser
                key={index}
                origem={passagem.origem}
                destino={passagem.destino}
                preco={passagem.preco || passagem.preco_voo || 100}
                imagemSrc={passagem.imagem_companhia || "/logo.jpeg"}
                assento={passagem.assento}
                companhia_aerea={passagem.companhia_aerea}
                capacidade_voo={passagem.capacidade_voo}
                id_passagem={passagem.id}
              />
            ))
          ) : (
            <p>Nenhuma passagem encontrada.</p>
          )}
        </ScrollArea>
      )}
    </section>
  );
}

export default ListTickets;