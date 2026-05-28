import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
  Alert,
  InputAdornment,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Check,
  EmojiEvents,
  Pets,
  Person,
  TrendingUp,
  AccountBalanceWallet,
  Psychology,
  Warning,
  CheckCircle,
} from '@mui/icons-material';

const steps = [
  'Chọn giải đấu & chặng đua',
  'Xem thống kê & AI',
  'Chọn loại dự đoán',
  'Nhập số tiền',
  'Xác nhận',
];

export default function CreatePrediction() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [selectedRace, setSelectedRace] = useState('');
  const [selectedHorse, setSelectedHorse] = useState('');
  const [predictionType, setPredictionType] = useState('');
  const [betAmount, setBetAmount] = useState('');
  const [walletBalance] = useState(15420);

  const tournaments = [
    { id: '1', name: 'Spring Championship 2026', status: 'Đang diễn ra', races: 5 },
    { id: '2', name: 'Elite Cup Series', status: 'Sắp bắt đầu', races: 3 },
    { id: '3', name: 'Summer Grand Prix', status: 'Mở đăng ký', races: 8 },
  ];

  const races = [
    { id: '1', name: 'Race #8 - Quarter Finals', startTime: '30 phút nữa', status: 'open' },
    { id: '2', name: 'Race #9 - Semi Finals', startTime: '2 giờ nữa', status: 'open' },
    { id: '3', name: 'Race #10 - Finals', startTime: '1 ngày nữa', status: 'open' },
  ];

  const horses = [
    {
      id: '1',
      name: 'Thunder Bolt',
      jockey: 'John Smith',
      wins: 45,
      accuracy: 89,
      recentForm: [1, 1, 2, 1, 3],
      aiConfidence: 92,
      aiRating: 'Rất cao',
      odds: 3.2,
      riskLevel: 'low',
      speed: 95,
      stamina: 88,
    },
    {
      id: '2',
      name: 'Lightning Strike',
      jockey: 'Mike Johnson',
      wins: 38,
      accuracy: 82,
      recentForm: [2, 1, 3, 2, 1],
      aiConfidence: 85,
      aiRating: 'Cao',
      odds: 2.8,
      riskLevel: 'low',
      speed: 92,
      stamina: 90,
    },
    {
      id: '3',
      name: 'Storm Chaser',
      jockey: 'David Lee',
      wins: 32,
      accuracy: 78,
      recentForm: [3, 2, 1, 4, 2],
      aiConfidence: 71,
      aiRating: 'Trung bình',
      odds: 2.5,
      riskLevel: 'medium',
      speed: 88,
      stamina: 85,
    },
    {
      id: '4',
      name: 'Wild Spirit',
      jockey: 'Sarah Wilson',
      wins: 28,
      accuracy: 72,
      recentForm: [4, 3, 2, 5, 3],
      aiConfidence: 58,
      aiRating: 'Thấp',
      odds: 4.5,
      riskLevel: 'high',
      speed: 82,
      stamina: 80,
    },
  ];

  const predictionTypes = [
    {
      id: 'win',
      name: 'Win',
      description: 'Dự đoán ngựa về nhất',
      multiplier: 'x3.0',
      difficulty: 'Cao',
    },
    {
      id: 'place',
      name: 'Place',
      description: 'Dự đoán ngựa về top 2',
      multiplier: 'x2.0',
      difficulty: 'Trung bình',
    },
    {
      id: 'show',
      name: 'Show',
      description: 'Dự đoán ngựa về top 3',
      multiplier: 'x1.5',
      difficulty: 'Thấp',
    },
    {
      id: 'exacta',
      name: 'Exacta',
      description: 'Dự đoán chính xác top 2 theo thứ tự',
      multiplier: 'x8.0',
      difficulty: 'Rất cao',
    },
    {
      id: 'trifecta',
      name: 'Trifecta',
      description: 'Dự đoán chính xác top 3 theo thứ tự',
      multiplier: 'x15.0',
      difficulty: 'Cực cao',
    },
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = () => {
    navigate('/predictions/my-predictions');
  };

  const getAIRecommendation = () => {
    const topHorse = horses.find((h) => h.id === '1');
    return topHorse;
  };

  const selectedHorseData = horses.find((h) => h.id === selectedHorse);
  const selectedPredictionType = predictionTypes.find((p) => p.id === predictionType);
  const potentialPayout = selectedPredictionType
    ? parseFloat(betAmount || '0') * parseFloat(selectedPredictionType.multiplier.replace('x', ''))
    : 0;

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Chọn giải đấu
            </Typography>
            <FormControl component="fieldset" fullWidth sx={{ mb: 4 }}>
              <RadioGroup value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)}>
                <Grid container spacing={2}>
                  {tournaments.map((tournament) => (
                    <Grid item xs={12} key={tournament.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          border: selectedTournament === tournament.id ? 2 : 1,
                          borderColor: selectedTournament === tournament.id ? 'primary.main' : 'divider',
                        }}
                        onClick={() => setSelectedTournament(tournament.id)}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Radio value={tournament.id} />
                              <EmojiEvents sx={{ fontSize: 40, color: '#f59e0b' }} />
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {tournament.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {tournament.races} chặng đua khả dụng
                                </Typography>
                              </Box>
                            </Box>
                            <Chip label={tournament.status} color="success" />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </RadioGroup>
            </FormControl>

            {selectedTournament && (
              <>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                  Chọn chặng đua
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup value={selectedRace} onChange={(e) => setSelectedRace(e.target.value)}>
                    <Grid container spacing={2}>
                      {races.map((race) => (
                        <Grid item xs={12} key={race.id}>
                          <Card
                            variant="outlined"
                            sx={{
                              cursor: 'pointer',
                              border: selectedRace === race.id ? 2 : 1,
                              borderColor: selectedRace === race.id ? 'primary.main' : 'divider',
                            }}
                            onClick={() => setSelectedRace(race.id)}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Radio value={race.id} />
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {race.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Bắt đầu: {race.startTime}
                                  </Typography>
                                </Box>
                                <Chip label="Mở dự đoán" color="success" size="small" />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </RadioGroup>
                </FormControl>
              </>
            )}
          </Box>
        );

      case 1:
        const aiHorse = getAIRecommendation();
        return (
          <Box>
            {/* AI Recommendation */}
            <Alert
              severity="info"
              icon={<Psychology />}
              sx={{ mb: 3, bgcolor: '#eff6ff', border: '1px solid #3b82f6' }}
            >
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                🤖 AI Recommendation
              </Typography>
              <Typography variant="body2">
                Dựa trên phân tích dữ liệu, AI khuyến nghị đặt cược vào{' '}
                <strong>{aiHorse?.name}</strong> với độ tin cậy {aiHorse?.aiConfidence}%
              </Typography>
            </Alert>

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Chọn ngựa đua
            </Typography>
            <Grid container spacing={2}>
              {horses.map((horse) => (
                <Grid item xs={12} md={6} key={horse.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      border: selectedHorse === horse.id ? 2 : 1,
                      borderColor: selectedHorse === horse.id ? 'primary.main' : 'divider',
                      position: 'relative',
                    }}
                    onClick={() => setSelectedHorse(horse.id)}
                  >
                    {horse.id === '1' && (
                      <Chip
                        label="AI Recommended"
                        size="small"
                        color="primary"
                        icon={<Psychology />}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      />
                    )}
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Avatar sx={{ width: 56, height: 56, bgcolor: '#667eea' }}>
                          <Pets />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {horse.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Jockey: {horse.jockey}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip label={`Tỷ lệ: x${horse.odds}`} size="small" color="primary" />
                            <Chip
                              label={`Risk: ${horse.riskLevel}`}
                              size="small"
                              color={horse.riskLevel === 'low' ? 'success' : horse.riskLevel === 'medium' ? 'warning' : 'error'}
                            />
                          </Box>
                        </Box>
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Số trận thắng
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {horse.wins}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Độ chính xác
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {horse.accuracy}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Tốc độ
                          </Typography>
                          <LinearProgress variant="determinate" value={horse.speed} sx={{ mt: 1 }} />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Sức bền
                          </Typography>
                          <LinearProgress variant="determinate" value={horse.stamina} sx={{ mt: 1 }} />
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Form gần đây
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {horse.recentForm.map((position, index) => (
                            <Chip
                              key={index}
                              label={position}
                              size="small"
                              color={position <= 2 ? 'success' : position === 3 ? 'warning' : 'default'}
                            />
                          ))}
                        </Box>
                      </Box>

                      <Box sx={{ mt: 2, p: 2, bgcolor: '#f3f4f6', borderRadius: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          AI Analysis
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Confidence
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {horse.aiConfidence}%
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Rating
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {horse.aiRating}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Chọn loại dự đoán
            </Typography>
            <Grid container spacing={2}>
              {predictionTypes.map((type) => (
                <Grid item xs={12} md={6} key={type.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      border: predictionType === type.id ? 2 : 1,
                      borderColor: predictionType === type.id ? 'primary.main' : 'divider',
                    }}
                    onClick={() => setPredictionType(type.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                          {type.name}
                        </Typography>
                        <Chip label={type.multiplier} color="primary" sx={{ fontWeight: 700 }} />
                      </Box>
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        {type.description}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <Chip label={`Độ khó: ${type.difficulty}`} size="small" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Card sx={{ mb: 3, bgcolor: '#f0fdf4', border: '1px solid #10b981' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountBalanceWallet sx={{ fontSize: 40, color: '#10b981' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Số dư ví hiện tại
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                      {walletBalance.toLocaleString()} coins
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Nhập số tiền đặt cược
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Số tiền"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">coins</InputAdornment>,
              }}
              sx={{ mb: 3 }}
            />

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[100, 500, 1000, 2000, 5000].map((amount) => (
                <Grid item xs={6} sm={4} md={2} key={amount}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setBetAmount(amount.toString())}
                    sx={{ py: 1.5 }}
                  >
                    {amount}
                  </Button>
                </Grid>
              ))}
            </Grid>

            {betAmount && (
              <Paper sx={{ p: 3, bgcolor: '#fefce8', border: '1px solid #facc15' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Tổng quan cược
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Số tiền đặt
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {parseFloat(betAmount || '0').toLocaleString()} coins
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Hệ số
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedPredictionType?.multiplier}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Tiền thắng dự kiến
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                      {potentialPayout.toLocaleString()} coins
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {parseFloat(betAmount || '0') > walletBalance && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Số dư không đủ! Vui lòng nhập số tiền nhỏ hơn {walletBalance.toLocaleString()} coins
              </Alert>
            )}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 3 }}>
              Vui lòng kiểm tra lại thông tin dự đoán trước khi xác nhận
            </Alert>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Thông tin dự đoán
                </Typography>
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#667eea' }}>
                        <EmojiEvents />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Giải đấu"
                      secondary={tournaments.find((t) => t.id === selectedTournament)?.name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#667eea' }}>
                        <Pets />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="Ngựa đua" secondary={selectedHorseData?.name} />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#667eea' }}>
                        <TrendingUp />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="Loại dự đoán" secondary={selectedPredictionType?.name} />
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#10b981' }}>
                        <AccountBalanceWallet />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Số tiền đặt"
                      secondary={`${parseFloat(betAmount || '0').toLocaleString()} coins`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Paper sx={{ p: 3, bgcolor: '#f0fdf4', border: '2px solid #10b981' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Tổng kết
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Số tiền đặt cược:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {parseFloat(betAmount || '0').toLocaleString()} coins
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body1">Hệ số thắng:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedPredictionType?.multiplier}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Tiền thắng dự kiến:
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#10b981' }}>
                  {potentialPayout.toLocaleString()} coins
                </Typography>
              </Box>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return selectedTournament && selectedRace;
      case 1:
        return selectedHorse;
      case 2:
        return predictionType;
      case 3:
        return betAmount && parseFloat(betAmount) > 0 && parseFloat(betAmount) <= walletBalance;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/predictions')} sx={{ mr: 2 }}>
          Quay lại
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Tạo dự đoán mới
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: 400 }}>{renderStepContent(activeStep)}</Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button disabled={activeStep === 0} onClick={handleBack} startIcon={<ArrowBack />}>
              Quay lại
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!isStepValid()}
                  startIcon={<Check />}
                  size="large"
                >
                  Xác nhận dự đoán
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  endIcon={<ArrowForward />}
                  size="large"
                >
                  Tiếp theo
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
