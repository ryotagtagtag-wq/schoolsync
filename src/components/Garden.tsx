import React, { useState } from 'react';
import { PlantType, PlantInstance } from '../types';
import { calculateVitality } from '../utils/plantLogic';

interface GardenProps {
  plants: PlantInstance[];
  plantTypes: PlantType[];
  activePlantId: string;
  onSetActive: (id: string) => void;
  onAddPlant: (typeId: string, nickname?: string) => void;
  onDeletePlant: (id: string) => void;
  onRenamePlant: (id: string, name: string) => void;
}

export const Garden: React.FC<GardenProps> = ({
  plants,
  plantTypes,
  activePlantId,
  onSetActive,
  onAddPlant,
  onDeletePlant,
  onRenamePlant,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlantNickname, setNewPlantNickname] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState(plantTypes[0].id);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleAddPlant = () => {
    if (!selectedTypeId) return;
    onAddPlant(selectedTypeId, newPlantNickname.trim() || undefined);
    setShowAddModal(false);
    setNewPlantNickname('');
  };

  const handleRename = (plant: PlantInstance) => {
    setRenamingId(plant.id);
    setRenameValue(plant.nickname || '');
  };

  const confirmRename = (plantId: string) => {
    onRenamePlant(plantId, renameValue.trim());
    setRenamingId(null);
    setRenameValue('');
  };

  const getVitalityColor = (v: number) => {
    if (v >= 80) return 'bg-forest-green';
    if (v >= 50) return 'bg-pastel-green';
    if (v >= 20) return 'bg-pastel-orange';
    return 'bg-pastel-red';
  };

  const getVitalityLabel = (v: number) => {
    if (v >= 80) return 'とても元気 😊';
    if (v >= 50) return '元気 🙂';
    if (v >= 20) return 'ちょっと疲れてる 😐';
    return '元気がない… 😢';
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 現在の植物カード */}
      <section aria-labelledby="current-plant-heading">
        <h2 id="current-plant-heading" className="text-xl font-bold text-forest-green mb-4 flex items-center gap-2">
          <span aria-hidden="true">🌱</span>
          今育てている植物
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {plants.map(plant => {
            const plantType = plantTypes.find(t => t.id === plant.plantTypeId) || plantTypes[0];
            const isActive = plant.id === activePlantId;
            const vitality = calculateVitality(plant);
            return (
              <article
                key={plant.id}
                className={`card p-4 animate-pop-in relative ${isActive ? 'ring-2 ring-forest-green' : ''}`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 bg-forest-green text-white text-xs px-2 py-0.5 rounded-full">
                    選択中
                  </div>
                )}
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-4xl" aria-hidden="true">{plantType.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-forest-green text-lg truncate">
                        {plant.nickname ? `${plant.nickname}（${plantType.name}）` : plantType.name}
                      </h3>
                      {plants.length > 1 && !isActive && (
                        <button
                          onClick={() => onSetActive(plant.id)}
                          className="btn-secondary text-xs whitespace-nowrap flex-shrink-0"
                        >
                          この子にする
                        </button>
                      )}
                    </div>
                    <p className="text-forest-green/60 text-sm truncate">{plantType.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        <span aria-hidden="true">✨</span> EXP: {plant.exp}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${getVitalityColor(vitality)}`} />
                        {getVitalityLabel(vitality)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRename(plant)}
                    className="btn-secondary text-xs flex-1"
                    aria-label={`${plantType.name}の名前を変える`}
                  >
                    ✏️ 名前変更
                  </button>
                  {plants.length > 1 && (
                    <button
                      onClick={() => onDeletePlant(plant.id)}
                      className="btn-secondary text-xs flex-1 text-pastel-red"
                      aria-label={`${plantType.name}を手放す`}
                    >
                      🗑️ 手放す
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 新しい植物を迎える */}
      <section aria-labelledby="add-plant-heading">
        <h2 id="add-plant-heading" className="text-xl font-bold text-forest-green mb-4 flex items-center gap-2">
          <span aria-hidden="true">✨</span>
          新しい植物を迎える
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {plantTypes.map(type => {
            const hasThisType = plants.some(p => p.plantTypeId === type.id);
            return (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedTypeId(type.id);
                  setShowAddModal(true);
                }}
                className={`card p-4 animate-pop-in text-center ${hasThisType ? 'opacity-60' : ''}`}
                disabled={hasThisType}
                aria-label={`${type.name}を迎える${hasThisType ? '（すでにお迎え済み）' : ''}`}
              >
                <span className="text-4xl block mb-2" aria-hidden="true">{type.emoji}</span>
                <h3 className="font-bold text-forest-green">{type.name}</h3>
                <p className="text-forest-green/60 text-xs mt-1">{type.description}</p>
                {hasThisType && (
                  <span className="text-xs text-forest-green/50 mt-2 block">お迎え済み</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 植物追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-xl p-6 m-4 max-w-sm animate-pop-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-forest-green mb-4 text-center">新しい植物を迎える</h3>
            <p className="text-forest-green/60 text-sm mb-4 text-center">
              この植物に名前をつけますか？（省略可）
            </p>
            <input
              type="text"
              value={newPlantNickname}
              onChange={e => setNewPlantNickname(e.target.value)}
              placeholder="例：ポチ、ミドリ、ひまわりちゃん..."
              className="w-full p-3 border border-forest-green/30 rounded-lg text-forest-green placeholder-forest-green/40 mb-4"
              maxLength={10}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddModal(false); setNewPlantNickname(''); }}
                className="flex-1 btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={handleAddPlant}
                className="flex-1 btn-primary"
              >
                迎える！ 🌱
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 名前変更モーダル */}
      {renamingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in" onClick={() => { setRenamingId(null); setRenameValue(''); }}>
          <div className="bg-white rounded-xl p-6 m-4 max-w-sm animate-pop-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-forest-green mb-4 text-center">名前を変える</h3>
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              placeholder="新しい名前"
              className="w-full p-3 border border-forest-green/30 rounded-lg text-forest-green placeholder-forest-green/40 mb-4"
              maxLength={10}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setRenamingId(null); setRenameValue(''); }}
                className="flex-1 btn-secondary"
              >
                キャンセル
              </button>
              <button
                onClick={() => confirmRename(renamingId)}
                className="flex-1 btn-primary"
              >
                変更する ✏️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


